// GitHub ko backend processing ke liye thoda sa saans lene ka waqt dena zaroori hai
const wait = (ms) => new Promise(res => setTimeout(res, ms));

export const createGithubRepoAndPush = async (token, repoName, files, onProgress) => {
  const baseUrl = 'https://api.github.com'
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }

  try {
    // STEP 1: User Verification
    onProgress('Verifying account...')
    const userRes = await fetch(`${baseUrl}/user`, { headers })
    if (!userRes.ok) throw new Error('Invalid Token! Please check permissions (repo scope is required).')
    const userData = await userRes.json()
    const owner = userData.login

    // STEP 2: Create Repository (auto_init ko false rakhenge taaki koi conflict na ho)
    onProgress('Creating repository...')
    const repoRes = await fetch(`${baseUrl}/user/repos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        name: repoName, 
        private: true, 
        auto_init: false // README conflict se bachne ke liye ise false kiya hai
      }),
    })
    
    if (!repoRes.ok) {
        const errorData = await repoRes.json()
        throw new Error(`Repo creation failed: ${errorData.message}`)
    }
    
    // GitHub ko initialize hone ke liye 3 seconds ka buffer denge
    onProgress('Initializing Git database...')
    await wait(3000);

    // STEP 3: Create Blobs (Har file ka content bhej rahe hain)
    const treeItems = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      onProgress(`Uploading files (${i + 1}/${files.length})...`)
      
      // Path ko saaf karna (Leading slashes hatana)
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
        throw new Error(`Upload failed for ${cleanPath}: ${blobErr.message}`);
      }
      
      const blobData = await blobRes.json()
      treeItems.push({
        path: cleanPath,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      })
    }

    // STEP 4: Build Tree (Yahan par asli error aa raha tha)
    onProgress('Building folder structure...')
    const treeRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        tree: treeItems 
      }),
    })
    
    if (!treeRes.ok) {
        const treeErr = await treeRes.json();
        // Ab aapko pata chalega ki GitHub ne mana kyun kiya
        throw new Error(`Tree creation failed: ${treeErr.message}`);
    }
    const treeData = await treeRes.json()

    // STEP 5: Create Initial Commit
    onProgress('Committing code...')
    const commitRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: 'Initial commit via JSS Mobile Uploader',
        tree: treeData.sha,
      }),
    })
    
    if (!commitRes.ok) {
      const commitErr = await commitRes.json();
      throw new Error(`Commit failed: ${commitErr.message}`);
    }
    const commitData = await commitRes.json()

    // STEP 6: Create Main Branch Reference
    onProgress('Finalizing push...')
    const pushRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/refs/heads/main`, {
      method: 'POST', // Nayi repo hai isliye POST karke main branch banayenge
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
    throw error // Yeh error App.jsx mein badiya sa alert dikhayega
  }
}
