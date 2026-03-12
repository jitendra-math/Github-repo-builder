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
    
    const extractedFiles = []
    
    // Zip ke andar ki saari files par loop chalayenge
    for (const [relativePath, zipEntry] of Object.entries(contents.files)) {
      
      // Folders ko ignore karenge kyunki GitHub path (jaise 'src/app.js') se automatically folder bana leta hai
      if (zipEntry.dir) continue
      
      // File ke content ko Base64 mein read karenge (Text aur Images dono ke liye safe hai)
      const base64Content = await zipEntry.async('base64')
      
      extractedFiles.push({
        path: relativePath,
        content: base64Content
      })
    }
    
    return extractedFiles
  } catch (error) {
    console.error("ZIP extraction error:", error)
    throw new Error("Failed to extract ZIP. File corrupt ho sakti hai.")
  }
}
