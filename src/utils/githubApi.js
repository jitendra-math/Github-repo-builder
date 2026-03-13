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

    // STEP 2: Create Repo (auto_init: true zaroori hai Git DB initialize karne ke liye)
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
        const specificError = errorData.errors ? errorData.errors[0].message : errorData.message;
        throw new Error(`Repo creation failed: ${specificError}`)
    }
    const repoData = await repoRes.json()
    // Branch ka naam dynamically le rahe hain (kuch accounts mein abhi bhi 'master' default hota hai)
    const branch = repoData.default_branch || 'main';

    // GitHub ko initial README aur database setup karne ke liye thoda time dena
    onProgress('Initializing Git database...')
    await wait(3000);

    // STEP 3: Create Blobs
    const treeItems = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      onProgress(`Uploading files (${i + 1}/${files.length})...`)
      
      // Slashes hata kar path clean karna
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

    // STEP 4: Build Tree (Initial commit ki tree ko base banakar)
    onProgress('Building folder structure...')
    
    const refRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/refs/heads/${branch}`, { headers })
    if (!refRes.ok) throw new Error(`Failed to find branch ${branch}.`);
    const refData = await refRes.json()
    const latestCommitSha = refData.object.sha

    const commitResBase = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/commits/${latestCommitSha}`, { headers })
    if (!commitResBase.ok) throw new Error('Failed to fetch base commit.');
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
        message: 'Initial commit via Mobile Uploader',
        tree: treeData.sha,
        parents: [latestCommitSha],
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
