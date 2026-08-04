const fs = require('fs');
const path = require('path');

function addUseClient(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      addUseClient(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (
        content.includes('useLanguage') || 
        content.includes('useAuth') ||
        content.includes('useState') ||
        content.includes('useEffect') ||
        content.includes('useRouter') ||
        content.includes('usePathname') ||
        content.includes('DemoModal')
      ) {
        if (!content.includes('"use client"') && !content.includes("'use client'")) {
          fs.writeFileSync(fullPath, '"use client";\n' + content, 'utf8');
          console.log('Added to ' + fullPath);
        }
      }
    }
  }
}

addUseClient(path.join(__dirname, 'next-app', 'src'));
