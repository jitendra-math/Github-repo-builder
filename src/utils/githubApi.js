// GitHub ko initialize hone ke liye thoda waqt dene ke liye
const wait = (ms) => new Promise(res => setTimeout(res, ms));

export const createGithubRepoAndPush = async (token, repoName, files, onProgress) => {
  const baseUrl = 'https://api.github.com'
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }

  try {
    // STEP 1: User Verify
    onProgress('Verifying account...')
    const userRes = await fetch(`${baseUrl}/user`, { headers })
    if (!userRes.ok) throw new Error('Invalid Token! Please check permissions.')
    const userData = await userRes.json()
    const owner = userData.login

    // STEP 2: Create Repo
    onProgress('Creating repository...')
    const repoRes = await fetch(`${baseUrl}/user/repos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        name: repoName, 
        private: true, 
        auto_init: true 
      }),
    })
    
    if (!repoRes.ok) {
        const errorData = await repoRes.json()
        throw new Error(`Repo creation failed: ${errorData.message}`)
    }
    const repoData = await repoRes.json()
    const branch = repoData.default_branch

    // --- SMART ADDITION: Wait for GitHub to initialize ---
    onProgress('Waiting for GitHub to initialize...')
    await wait(2500); 

    // STEP 3: Create Blobs
    const treeItems = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      onProgress(`Uploading files (${i + 1}/${files.length})...`)
      
      const blobRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          content: file.content, 
          encoding: 'base64' 
        }),
      })
      
      if (!blobRes.ok) {
        const err = await blobRes.json();
        throw new Error(`Blob failed for ${file.path}: ${err.message}`);
      }
      
      const blobData = await blobRes.json()
      treeItems.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      })
    }

    // STEP 4: Build Tree
    onProgress('Building folder structure...')
    const refRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/refs/heads/${branch}`, { headers })
    if (!refRes.ok) throw new Error('Could not find main branch yet. Try again.');
    const refData = await refRes.json()
    const latestCommitSha = refData.object.sha

    const commitResBase = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/commits/${latestCommitSha}`, { headers })
    const commitDataBase = await commitResBase.json()
    const baseTreeSha = commitDataBase.tree.sha

    const treeRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        base_tree: baseTreeSha, 
        tree: treeItems 
      }),
    })
    if (!treeRes.ok) throw new Error('Tree creation failed.');
    const treeData = await treeRes.json()

    // STEP 5: Create Commit
    onProgress('Committing code...')
    const commitRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: 'Initial commit via JSS Mobile Uploader',
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    })
    if (!commitRes.ok) throw new Error('Commit failed.');
    const commitData = await commitRes.json()

    // STEP 6: Push to main
    onProgress('Finalizing push...')
    const pushRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sha: commitData.sha }),
    })
    if (!pushRes.ok) throw new Error('Final push to branch failed.');

    return `https://github.com/${owner}/${repoName}`

  } catch (error) {
    console.error("GitHub API Error:", error)
    throw error // Yeh error App.jsx mein alert bankar dikhega
  }
}
