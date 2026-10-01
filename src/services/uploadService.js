// Completely bypass Supabase for storage -> Use LocalStorage instead to guarantee data is saved without auth

export async function uploadImage(file, userId) {
  // Convert image to Base64 to save locally instead of Supabase Storage
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

export async function saveUploadRecord(userId, imageUrl) {
  const uploads = JSON.parse(localStorage.getItem('agroai_uploads') || '[]');
  
  const upload = {
    id: `upload-${Date.now()}`,
    user_id: userId,
    image_url: imageUrl,
    created_at: new Date().toISOString()
  };
  
  uploads.push(upload);
  localStorage.setItem('agroai_uploads', JSON.stringify(uploads));
  
  return upload;
}

export async function saveResult(uploadId, result) {
  const results = JSON.parse(localStorage.getItem('agroai_results') || '[]');
  
  const record = {
    id: `result-${Date.now()}`,
    upload_id: uploadId,
    disease: result.disease,
    symptoms: result.symptoms,
    remedy: result.remedy,
    prevention: result.prevention,
    confidence: result.confidence,
    created_at: new Date().toISOString()
  };
  
  results.push(record);
  localStorage.setItem('agroai_results', JSON.stringify(results));
  
  return record;
}

export async function getHistory(userId) {
  const uploads = JSON.parse(localStorage.getItem('agroai_uploads') || '[]');
  const results = JSON.parse(localStorage.getItem('agroai_results') || '[]');
  
  // Filter for user
  const userUploads = uploads.filter(u => u.user_id === userId);
  
  // Attach latest result for each upload
  const history = userUploads.map(upload => {
    const uploadResults = results.filter(r => r.upload_id === upload.id);
    return {
      ...upload,
      results: uploadResults
    };
  });
  
  // Sort descending by creation date
  return history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function getLocalImageUrl(file) {
  return URL.createObjectURL(file);
}
