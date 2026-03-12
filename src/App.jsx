import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'

// Layout & UI Components
import MobileContainer from './components/layout/MobileContainer'

// Screens
import SetupScreen from './components/screens/SetupScreen'
import UploadScreen from './components/screens/UploadScreen'
import PreviewScreen from './components/screens/PreviewScreen'
import ProcessingScreen from './components/screens/ProcessingScreen'
import SuccessScreen from './components/screens/SuccessScreen'

// Utils
import { extractZipForGithub } from './utils/zipExtract'
import { createGithubRepoAndPush } from './utils/githubApi'

export default function App() {
  // --- States ---
  const [currentScreen, setCurrentScreen] = useState('setup') // setup, upload, preview, processing, success
  const [token, setToken] = useState('')
  const [repoName, setRepoName] = useState('')
  const [zipFile, setZipFile] = useState(null)
  const [extractedFiles, setExtractedFiles] = useState([])
  
  // Progress States
  const [statusMessage, setStatusMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const [finalRepoUrl, setFinalRepoUrl] = useState('')

  // --- Effects ---
  useEffect(() => {
    const savedToken = localStorage.getItem('gh_mobile_token')
    if (savedToken) {
      setToken(savedToken)
      setCurrentScreen('upload')
    }
  }, [])

  // --- Handlers ---

  const handleSaveToken = (newToken) => {
    setToken(newToken)
    localStorage.setItem('gh_mobile_token', newToken)
    setCurrentScreen('upload')
  }

  const handleClearToken = () => {
    localStorage.removeItem('gh_mobile_token')
    setToken('')
    setCurrentScreen('setup')
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setZipFile(file)
    try {
      // ZIP extract karke base64 array nikalna
      const files = await extractZipForGithub(file)
      setExtractedFiles(files)
    } catch (error) {
      alert(error.message)
      setZipFile(null)
    }
  }

  const handleResetUpload = () => {
    setZipFile(null)
    setExtractedFiles([])
  }

  const startDeployment = async () => {
    setCurrentScreen('processing')
    try {
      const url = await createGithubRepoAndPush(
        token, 
        repoName, 
        extractedFiles, 
        (msg) => {
          setStatusMessage(msg)
          // Progress logic (Dheere dheere bar badhana)
          setProgress((prev) => Math.min(prev + (100 / (extractedFiles.length + 5)), 95))
        }
      )
      setFinalRepoUrl(url)
      setProgress(100)
      setCurrentScreen('success')
    } catch (error) {
      alert("Error: " + error.message)
      setCurrentScreen('upload')
      setProgress(0)
    }
  }

  const handleDone = () => {
    setRepoName('')
    setZipFile(null)
    setExtractedFiles([])
    setProgress(0)
    setCurrentScreen('upload')
  }

  return (
    <MobileContainer>
      <AnimatePresence mode="wait">
        
        {/* 1. Setup Screen */}
        {currentScreen === 'setup' && (
          <SetupScreen 
            token={token} 
            setToken={setToken} 
            onSave={handleSaveToken} 
          />
        )}

        {/* 2. Upload Screen */}
        {currentScreen === 'upload' && (
          <UploadScreen 
            repoName={repoName}
            setRepoName={setRepoName}
            zipFile={zipFile}
            extractedFiles={extractedFiles}
            onFileUpload={handleFileUpload}
            onResetUpload={handleResetUpload}
            onClearToken={handleClearToken}
            onCreateRepo={() => setCurrentScreen('preview')}
          />
        )}

        {/* 3. Preview Screen */}
        {currentScreen === 'preview' && (
          <PreviewScreen 
            repoName={repoName}
            extractedFiles={extractedFiles}
            onBack={() => setCurrentScreen('upload')}
            onConfirm={startDeployment}
          />
        )}

        {/* 4. Processing Screen */}
        {currentScreen === 'processing' && (
          <ProcessingScreen 
            statusMessage={statusMessage}
            progress={progress}
          />
        )}

        {/* 5. Success Screen */}
        {currentScreen === 'success' && (
          <SuccessScreen 
            repoUrl={finalRepoUrl}
            onDone={handleDone}
          />
        )}

      </AnimatePresence>
    </MobileContainer>
  )
}
