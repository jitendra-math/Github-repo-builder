// GitHub API thodi slow hoti hai repo banane ke baad, isliye wait function
const wait = (ms) => new Promise(res => setTimeout(res, ms));

export const createGithubRepoAndPush = async (token, repoName, files, onProgress) => {
  const baseUrl = 'https://api.github.com';
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  try {
    // STEP 1: Verification
    onProgress('Verifying account...');
    const userRes = await fetch(`${baseUrl}/user`, { headers });
    if (!userRes.ok) throw new Error('Invalid Token! Please check permissions.');
    const userData = await userRes.json();
    const owner = userData.login;

    // STEP 2: Create Repo (auto_init: true zaroori hai "Empty Repo" error se bachne ke liye)
    onProgress('Creating repository...');
    const repoRes = await fetch(`${baseUrl}/user/repos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: repoName,
        private: true,
        auto_init: true 
      }),
    });

    if (!repoRes.ok) {
        const errorData = await repoRes.json();
        throw new Error(`Repo creation failed: ${errorData.message}`);
    }

    onProgress('Waiting for GitHub database to setup...');
    await wait(4000); // 4 seconds ka pakka wait taaki GitHub backend ready ho jaye

    // Repo ko dobara fetch karke asli default branch nikalna
    const repoCheck = await fetch(`${baseUrl}/repos/${owner}/${repoName}`, { headers });
    const repoCheckData = await repoCheck.json();
    const branch = repoCheckData.default_branch || 'main';

    // STEP 3: Create Blobs (Yahan hum paths ko saaf karenge aur hidden files hatayenge)
    const treeItems = [];
    
    const safeFiles = files.filter(f => {
        const p = f.path.toLowerCase();
        // .git, .DS_Store, aur __MACOSX jaise hidden folders ko block karna
        return p && !p.includes('.git/') && !p.includes('.ds_store') && !p.includes('__macosx');
    });

    for (let i = 0; i < safeFiles.length; i++) {
      const file = safeFiles[i];
      onProgress(`Uploading files (${i + 1}/${safeFiles.length})...`);

      // SUPER FIX: Path ko ekdum clean karna (kuch bhi ajeeb slashes hatana)
      const cleanPath = file.path.split('/').filter(Boolean).join('/');

      const blobRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: file.content || "", encoding: 'base64' }),
      });

      if (!blobRes.ok) {
        const blobErr = await blobRes.json();
        throw new Error(`Blob failed for ${cleanPath}: ${blobErr.message}`);
      }

      const blobData = await blobRes.json();
      treeItems.push({
        path: cleanPath,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      });
    }

    // STEP 4: Build Tree (Base tree ke upar naya tree banana)
    onProgress('Fetching base tree...');
    const refRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/refs/heads/${branch}`, { headers });
    if (!refRes.ok) throw new Error(`Could not find branch ${branch}. GitHub API is delayed.`);
    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    const commitResBase = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/commits/${latestCommitSha}`, { headers });
    const commitDataBase = await commitResBase.json();
    const baseTreeSha = commitDataBase.tree.sha;

    onProgress('Building folder structure...');
    const treeRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems
      }),
    });

    if (!treeRes.ok) {
        const treeErr = await treeRes.json();
        throw new Error(`Tree creation failed: ${treeErr.message}`);
    }
    const treeData = await treeRes.json();

    // STEP 5: Create Commit
    onProgress('Committing code...');
    const commitRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: 'Initial project upload via Web App',
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    });

    if (!commitRes.ok) {
        const commitErr = await commitRes.json();
        throw new Error(`Commit failed: ${commitErr.message}`);
    }
    const commitData = await commitRes.json();

    // STEP 6: Final Push
    onProgress('Finalizing push...');
    const pushRes = await fetch(`${baseUrl}/repos/${owner}/${repoName}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sha: commitData.sha }),
    });

    if (!pushRes.ok) {
        const pushErr = await pushRes.json();
        throw new Error(`Final push failed: ${pushErr.message}`);
    }

    return `https://github.com/${owner}/${repoName}`;

  } catch (error) {
    console.error("GitHub API Error:", error);
    throw error;
  }
}
