/**
 * GitHub API ke through repo create aur files push karne ka master function.
 * @param {string} token - User ka Personal Access Token
 * @param {string} repoName - Nayi repository ka naam
 * @param {Array} files - Array of objects { path: string, content: string (base64) }
 * @param {function} onProgress - Progress update karne ke liye callback
 */
export const createGithubRepoAndPush = async (token, repoName, files, onProgress) => {
  const baseUrl = 'https://api.github.com'
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }

  try {
    // STEP 1: Get Authenticated User ki details (username nikalne ke liye)
    onProgress('Verifying account...')
    const userRes = await fetch(`${baseUrl}/user`, { headers })
    if (!userRes.ok) throw new Error('Invalid Token ya permissions missing hain.')
    const userData = await userRes.json()
    const owner = userData.login

    // STEP 2: Create a New Private Repository (with auto_init so it has a main branch)
    onProgress('Creating repository...')
    const repoRes = await fetch(`${baseUrl}/user/repos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        name: repoName, 
        private: true, // Personal use ke liye private best hai
        auto_init: true // Yeh automatically initial commit aur default branch bana dega
      }),
    })
    
    if (!repoRes.ok) {
        const errorData = await repoRes.json()
        throw new Error(`Repo creation failed: ${errorData.message}`)
    }
    const repoData = await repoRes.json()
    const branch = repoData.default_branch // Usually 'main' hota hai

    // STEP 3: Create Blobs for each file
    const treeItems = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      onProgress(`Uploading files (${i + 1}/${files.length})...`)
      
      const blobRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          content: file.content, 
          encoding: 'base64' // Base64 zaroori hai images aur code dono handle karne ke liye
        }),
      })
      const blobData = await blobRes.json()
      
      // Tree item prepare kar rahe hain
      treeItems.push({
        path: file.path,
        mode: '100644', // Standard file mode
        type: 'blob',
        sha: blobData.sha,
      })
    }

    // STEP 4: Naya Git Tree create karna (Yeh GitHub ko folder structure batayega)
    onProgress('Building folder structure...')
    
    // Pehle base tree ka SHA nikalenge taaki purani history merge ho sake
    const refRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/refs/heads/${branch}`, { headers })
    const refData = await refRes.json()
    const latestCommitSha = refData.object.sha

    const commitResBase = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/commits/${latestCommitSha}`, { headers })
    const commitDataBase = await commitResBase.json()
    const baseTreeSha = commitDataBase.tree.sha

    // Ab nayi tree push karenge
    const treeRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        base_tree: baseTreeSha, 
        tree: treeItems 
      }),
    })
    const treeData = await treeRes.json()

    // STEP 5: Create a new Commit
    onProgress('Committing code...')
    const commitRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: 'Initial commit via Mobile Folder Uploader',
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    })
    const commitData = await commitRes.json()

    // STEP 6: Update Branch Reference (Push)
    onProgress('Pushing to main branch...')
    await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sha: commitData.sha }),
    })

    // Final Repo ka URL return karenge
    return `https://github.com/${owner}/${repoName}`

  } catch (error) {
    console.error("GitHub API Error:", error)
    throw error
  }
}
