const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const nextDir = path.join(__dirname, 'next-app', 'src');

function transformFile(fullPath) {
  const file = path.basename(fullPath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  if (
    content.includes('useState') || 
    content.includes('useEffect') ||
    content.includes('useRef') ||
    content.includes('useCallback') ||
    content.includes('useContext') ||
    content.includes('useNavigate')
  ) {
    if (!content.includes('"use client"') && !content.includes("'use client'")) {
      content = '"use client";\n' + content;
    }
  }

  if (content.includes('react-router-dom')) {
    content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]react-router-dom['"]/g, (match, imports) => {
      let nextImports = [];
      if (imports.includes('useNavigate')) nextImports.push('useRouter as useNavigate');
      if (imports.includes('useLocation')) nextImports.push('usePathname as useLocation');
      
      let res = '';
      if (nextImports.length) {
        res += `import { ${nextImports.join(', ')} } from 'next/navigation';\n`;
      }
      if (imports.includes('Link') || imports.includes('NavLink')) {
        res += `import Link from 'next/link';\n`;
      }
      if (imports.includes('Navigate')) {
        res += `import { redirect as Navigate } from 'next/navigation';\n`;
      }
      return res;
    });

    content = content.replace(/<Link([^>]*?)to=/g, '<Link$1href=');
    content = content.replace(/<NavLink/g, '<Link');
    content = content.replace(/<\/NavLink>/g, '</Link>');
  }

  const relativePath = path.relative(srcDir, fullPath);
  let outPath = path.join(nextDir, relativePath);

  if (relativePath.startsWith('pages' + path.sep)) {
    const pageName = path.basename(file, '.jsx').toLowerCase();
    let appDir;
    if (pageName === 'home') {
      appDir = path.join(nextDir, 'app');
    } else {
      appDir = path.join(nextDir, 'app', pageName);
    }
    
    fs.mkdirSync(appDir, { recursive: true });
    outPath = path.join(appDir, 'page.jsx');
    
    if (pageName !== 'home') {
      content = content.replace(/from\s+['"]\.\.\//g, 'from \'../../');
    }
  } else {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
  }

  fs.writeFileSync(outPath, content, 'utf8');
}

function processItem(itemPath) {
  const stat = fs.statSync(itemPath);
  
  if (stat.isDirectory()) {
    const files = fs.readdirSync(itemPath);
    files.forEach(file => {
      processItem(path.join(itemPath, file));
    });
  } else if (itemPath.endsWith('.js') || itemPath.endsWith('.jsx')) {
    transformFile(itemPath);
  } else {
    const relativePath = path.relative(srcDir, itemPath);
    const outPath = path.join(nextDir, relativePath);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.copyFileSync(itemPath, outPath);
  }
}

const items = fs.readdirSync(srcDir);
items.forEach(item => {
  if (item === 'App.jsx' || item === 'main.jsx') return;
  processItem(path.join(srcDir, item));
});

console.log('Migration script completed.');
