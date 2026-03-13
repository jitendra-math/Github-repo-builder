const wait = (ms) => new Promise(res => setTimeout(res, ms));

export const createGithubRepoAndPush = async (token, repoName, files, onProgress) => {
  const baseUrl = 'https://api.github.com'
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }

  try {
    // STEP 1: Verification
    onProgress('Verifying account...')
    const userRes = await fetch(`${baseUrl}/user`, { headers })
    if (!userRes.ok) throw new Error('Invalid Token! Please check permissions.')
    const userData = await userRes.json()
    const owner = userData.login

    // STEP 2: Create Repo (auto_init: true zaroori hai taaki blobs upload ho sakein)
    onProgress('Creating repository...')
    const repoRes = await fetch(`${baseUrl}/user/repos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        name: repoName, 
        private: true, 
        auto_init: true // 100% required
      }),
    })
    
    if (!repoRes.ok) {
        const errorData = await repoRes.json()
        const specificError = errorData.errors ? errorData.errors[0].message : errorData.message;
        throw new Error(`Repo creation failed: ${specificError}`)
    }
    
    const repoData = await repoRes.json()
    const branch = repoData.default_branch || 'main';

    onProgress('Initializing Git database...')
    await wait(2500); // 2.5 seconds delay

    // STEP 3: Create Blobs (Ab empty repo wala error nahi aayega)
    const treeItems = []
    const safeFiles = files.filter(f => !f.path.includes('.git/') && !f.path.includes('.DS_Store'));

    for (let i = 0; i < safeFiles.length; i++) {
      const file = safeFiles[i]
      onProgress(`Uploading files (${i + 1}/${safeFiles.length})...`)
      
      const cleanPath = file.path.replace(/^\/+/, '');
      
      const blobRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: file.content, encoding: 'base64' }),
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

    // STEP 4: Build Tree (THE FIX: Yahan se 'base_tree' completely uda diya hai)
    onProgress('Building folder structure...')
    
    // Parent commit nikalna taaki history break na ho
    const refRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/refs/heads/${branch}`, { headers })
    if (!refRes.ok) throw new Error(`Failed to find branch ${branch}.`);
    const refData = await refRes.json()
    const latestCommitSha = refData.object.sha

    // Bina base_tree ke naya tree banana (Ab "Not Found" ka error impossible hai)
    const treeRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        tree: treeItems // sirf nayi files pass kar rahe hain
      }),
    })
    
    if (!treeRes.ok) {
        const treeErr = await treeRes.json();
        throw new Error(`Tree creation failed: ${treeErr.message}`);
    }
    const treeData = await treeRes.json()

    // STEP 5: Create Commit
    onProgress('Committing code...')
    const commitRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: 'Initial commit via JSS Mobile Uploader',
        tree: treeData.sha,
        parents: [latestCommitSha], // Pehli README se jodne ke liye
      }),
    })
    
    if (!commitRes.ok) {
      const commitErr = await commitRes.json();
      throw new Error(`Commit failed: ${commitErr.message}`);
    }
    const commitData = await commitRes.json()

    // STEP 6: Update Branch Reference
    onProgress('Finalizing push...')
    const pushRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ 
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
