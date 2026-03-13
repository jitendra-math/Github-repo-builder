export const createGithubRepoAndPush = async (token, repoName, files, onProgress) => {
  const baseUrl = 'https://api.github.com'
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }

  try {
    // STEP 1: Verify User
    onProgress('Verifying account...')
    const userRes = await fetch(`${baseUrl}/user`, { headers })
    if (!userRes.ok) throw new Error('Invalid Token! Please check permissions.')
    const userData = await userRes.json()
    const owner = userData.login

    // STEP 2: Create a COMPLETELY EMPTY Repo (auto_init: false)
    onProgress('Creating empty repository...')
    const repoRes = await fetch(`${baseUrl}/user/repos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        name: repoName, 
        private: true, 
        auto_init: false // Isko false hi rakhna hai taaki GitHub beech mein tang na adaye
      }),
    })
    
    if (!repoRes.ok) {
        const errorData = await repoRes.json()
        const specificError = errorData.errors ? errorData.errors[0].message : errorData.message;
        throw new Error(`Repo creation failed: ${specificError}`)
    }

    // STEP 3: Create Blobs (With Safety Filter)
    const treeItems = []
    
    // Faltu hidden files ko ignore karenge jo GitHub API ko block kar sakti hain
    const safeFiles = files.filter(f => !f.path.includes('.git/') && !f.path.includes('.DS_Store'));

    for (let i = 0; i < safeFiles.length; i++) {
      const file = safeFiles[i]
      onProgress(`Uploading files (${i + 1}/${safeFiles.length})...`)
      
      const cleanPath = file.path.replace(/^\/+/, '');
      
      const blobRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          content: file.content, 
          encoding: 'base64' 
        }),
      })
      
      if (!blobRes.ok) {
        const blobErr = await blobRes.json();
        throw new Error(`Blob upload failed for ${cleanPath}: ${blobErr.message}`);
      }
      
      const blobData = await blobRes.json()
      treeItems.push({
        path: cleanPath,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      })
    }

    // STEP 4: Build Root Tree (Bina kisi purane reference ke)
    onProgress('Building root folder structure...')
    const treeRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        tree: treeItems 
      }),
    })
    
    if (!treeRes.ok) {
        const treeErr = await treeRes.json();
        throw new Error(`Tree creation failed: ${treeErr.message}`);
    }
    const treeData = await treeRes.json()

    // STEP 5: Create First "Root" Commit (Bina kisi parent ke)
    onProgress('Committing code...')
    const commitRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: 'Initial commit via JSS Mobile Uploader',
        tree: treeData.sha
        // Yahan 'parents' array intentionally nahi daala hai kyunki yeh pehla commit hai
      }),
    })
    
    if (!commitRes.ok) {
      const commitErr = await commitRes.json();
      throw new Error(`Commit failed: ${commitErr.message}`);
    }
    const commitData = await commitRes.json()

    // STEP 6: Create Main Branch and push
    onProgress('Finalizing push to main branch...')
    const pushRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/refs`, {
      method: 'POST', // Nayi branch banane ke liye POST use hota hai
      headers,
      body: JSON.stringify({ 
        ref: 'refs/heads/main',
        sha: commitData.sha 
      }),
    })
    
    if (!pushRes.ok) {
      const pushErr = await pushRes.json();
      throw new Error(`Final push failed: ${pushErr.message}`);
    }

    return `https://github.com/${owner}/${repoName}`

  } catch (error) {
    console.error("GitHub API Error:", error)
    throw error
  }
}
