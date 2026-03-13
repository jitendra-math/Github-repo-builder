import JSZip from 'jszip'

/**
 * Upload ki gayi ZIP file ko extract karke GitHub API ke liye prepare karta hai.
 * @param {File} zipFile - Uploaded .zip file
 * @returns {Promise<Array<{path: string, content: string}>>} Array of files with base64 content
 */
export const extractZipForGithub = async (zipFile) => {
  try {
    const zip = new JSZip()
    const contents = await zip.loadAsync(zipFile)
    
    let extractedFiles = []
    
    // STEP 1: Extract and Filter Junk
    for (const [relativePath, zipEntry] of Object.entries(contents.files)) {
      
      // Folders ko ignore karenge 
      if (zipEntry.dir) continue
      
      // Faltu OS files aur Git history ko yahi rok denge taaki API tak na pahuchein
      const lowerPath = relativePath.toLowerCase();
      if (
        lowerPath.includes('__macosx') || 
        lowerPath.includes('.ds_store') || 
        lowerPath.includes('.git/') ||
        lowerPath.includes('node_modules/') // node_modules bhi ignore kar diya taaki crash na ho
      ) {
        continue;
      }
      
      // File ke content ko Base64 mein read karenge
      const base64Content = await zipEntry.async('base64')
      
      extractedFiles.push({
        path: relativePath,
        content: base64Content
      })
    }

    // STEP 2: The "Root Folder" Fix (Smart Path Trimming)
    // Agar saari files ek hi main folder ke andar band hain, toh us main folder ko path se hata denge
    if (extractedFiles.length > 0) {
      const firstPathParts = extractedFiles[0].path.split('/');
      
      // Check karenge ki kya file kisi folder ke andar hai
      if (firstPathParts.length > 1) {
        const possibleRoot = firstPathParts[0] + '/';
        
        // Kya har ek file is same root folder se shuru hoti hai?
        const isWrappedInRoot = extractedFiles.every(file => file.path.startsWith(possibleRoot));
        
        if (isWrappedInRoot) {
          // Agar haan, toh us root folder ko har file ke path se kaat denge
          extractedFiles = extractedFiles.map(file => ({
            ...file,
            path: file.path.substring(possibleRoot.length)
          }));
        }
      }
    }
    
    return extractedFiles
  } catch (error) {
    console.error("ZIP extraction error:", error)
    throw new Error("Failed to extract ZIP. File corrupt ho sakti hai.")
  }
}
