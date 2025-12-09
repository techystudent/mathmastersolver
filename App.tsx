import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, X, Upload, Camera, FileText, Sun, Moon, 
  ChevronRight, Share2, Download, AlertCircle, CheckCircle, 
  BookOpen, Calculator, Beaker, Zap, Settings, Copy, Check 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateSolution } from './services/geminiService';
import { AdPlaceholder } from './components/AdPlaceholder';
import { AboutPage, ContactPage, PrivacyPolicy, TermsConditions, Disclaimer } from './components/LegalComponents';
import { PageRoute, SolveStatus, AdConfig } from './types';
import { DEFAULT_AD_CONFIG } from './constants';

// --- Utility Components ---

const CopyButton = ({ text, className = "" }: { text: string, className?: string }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy} 
      className={`p-1.5 sm:p-2 rounded-lg transition-colors flex items-center gap-1 ${copied ? 'text-green-600 bg-green-50 dark:bg-green-900/30' : 'text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700'} ${className}`}
      title="Copy to clipboard"
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      <span className="sr-only">Copy</span>
    </button>
  );
};

// --- Main Application ---

const App: React.FC = () => {
  // State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [page, setPage] = useState<PageRoute>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [solveStatus, setSolveStatus] = useState<SolveStatus>(SolveStatus.IDLE);
  
  // Input State
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [language, setLanguage] = useState('English');
  const [result, setResult] = useState<string>('');
  
  // Ad Config State (Simulated Admin)
  const [showAdConfig, setShowAdConfig] = useState(false);
  const [adConfig, setAdConfig] = useState<AdConfig>(DEFAULT_AD_CONFIG);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Theme
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Trigger MathJax Typeset when result changes
  useEffect(() => {
    if (result && (window as any).MathJax) {
      // Use setTimeout to ensure DOM is updated by ReactMarkdown first
      setTimeout(() => {
        (window as any).MathJax.typesetPromise && (window as any).MathJax.typesetPromise();
      }, 100);
    }
  }, [result]);

  // Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolve = async () => {
    if (!inputText && !selectedImage) {
      alert("Please enter a question or upload an image.");
      return;
    }

    setSolveStatus(SolveStatus.ANALYZING);
    setResult('');
    
    // Simulate analyzing phase for UX
    setTimeout(async () => {
      try {
        setSolveStatus(SolveStatus.SOLVING);
        const aiResponse = await generateSolution(inputText, selectedImage, language);
        setResult(aiResponse);
        setSolveStatus(SolveStatus.COMPLETED);
      } catch (error) {
        setResult("Error: " + (error as Error).message);
        setSolveStatus(SolveStatus.ERROR);
      }
    }, 1500);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'TechyStudent Solution',
        text: 'Check out this solution from TechyStudent AI!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const resetForm = () => {
    setInputText('');
    setSelectedImage(null);
    setResult('');
    setSolveStatus(SolveStatus.IDLE);
  };

  // Helper to parse the result string into sections
  const parseResult = (text: string) => {
    const parsed = {
      steps: [] as { title: string, content: string }[],
      finalAnswer: '',
      fallback: false
    };

    if (!text) return null;

    // 1. Extract Final Answer
    // Look for ## Final Answer or **Final Answer** case insensitive
    const finalAnswerRegex = /(?:##|\*\*)\s*Final Answer/i;
    const finalMatch = text.match(finalAnswerRegex);
    let stepsText = text;

    if (finalMatch && finalMatch.index !== undefined) {
      // Extract everything after the match, trim leading colons/whitespace
      parsed.finalAnswer = text.substring(finalMatch.index + finalMatch[0].length).replace(/^[:\s*]+/, '').trim();
      stepsText = text.substring(0, finalMatch.index).trim();
    }

    // 2. Extract Solution Steps section content
    const stepsHeaderRegex = /##\s*Solution Steps/i;
    const stepsMatch = stepsText.match(stepsHeaderRegex);
    
    let contentToParse = stepsText;
    if (stepsMatch && stepsMatch.index !== undefined) {
      contentToParse = stepsText.substring(stepsMatch.index + stepsMatch[0].length).trim();
    }

    // 3. Robust Step Splitting
    let rawSteps: string[] = [];
    
    // Determine the primary step format to avoid mixed splitting
    // Check for Markdown headers first (### Step 1...)
    if (/(?:^|\n)###\s+/.test(contentToParse)) {
       rawSteps = contentToParse.split(/(?:^|\n)(?=###\s+)/).filter(s => s.trim());
    } 
    // Check for Bold headers (**Step 1**)
    else if (/(?:^|\n)\*\*(?:Step|Step\s+\d+).*?\*\*/i.test(contentToParse)) {
       rawSteps = contentToParse.split(/(?:^|\n)(?=\*\*(?:Step|Step\s+\d+).*?\*\*)/i).filter(s => s.trim());
    }
    // Check for "Step N:" pattern
    else if (/(?:^|\n)Step\s+\d+[:.]/i.test(contentToParse)) {
       rawSteps = contentToParse.split(/(?:^|\n)(?=Step\s+\d+[:.])/i).filter(s => s.trim());
    }
    // Check for Numbered list "1. " pattern if it looks like steps
    else if (/(?:^|\n)\d+\.\s+[A-Z]/.test(contentToParse)) {
       rawSteps = contentToParse.split(/(?:^|\n)(?=\d+\.\s+)/).filter(s => s.trim());
    }
    else {
       // Fallback: No obvious step structure
       rawSteps = [contentToParse];
    }

    parsed.steps = rawSteps.map(rawStep => {
      // Clean up the raw step
      const lines = rawStep.trim().split('\n');
      let header = lines[0].trim();
      let content = lines.slice(1).join('\n').trim();
      
      // Clean up the title from the header line
      // Remove Markdown headers
      let title = header.replace(/^###\s*/, '').replace(/\*\*/g, '');
      
      // Identify "Step N" or "1." prefix
      // Regex: Start of line, "Step" optional space digits, optional chars like ":", ".", "-"
      const prefixRegex = /^(?:Step\s*\d+|Step\s+[A-Z]|\d+\.)[:.\s-]*/i;
      const prefixMatch = title.match(prefixRegex);
      
      if (prefixMatch) {
        title = title.substring(prefixMatch[0].length).trim();
      }

      // Handle single-line steps or empty content
      if (!content) {
          // If the rest of the header is substantial, treat it as content
          if (title.length > 0) {
              content = title;
              title = "Explanation";
          }
      }
      
      // Fallback for empty title
      if (!title) {
        title = "Step Details";
      }

      return { title, content };
    }).filter(s => s.content && s.content.length > 0);

    // If parsing failed to produce steps but we have text (and it wasn't just "Solution Steps"), 
    // treat the whole thing as one step if reasonable, or fallback.
    if (parsed.steps.length === 0) {
        if (contentToParse.trim().length > 0) {
             // Just one block of text?
             parsed.steps.push({ title: "Analysis", content: contentToParse });
        } else if (!parsed.finalAnswer) {
             parsed.fallback = true;
        }
    }

    return parsed;
  };

  const parsedData = result ? parseResult(result) : null;

  const NavLink = ({ to, label }: { to: PageRoute, label: string }) => (
    <button 
      onClick={() => { setPage(to); setMenuOpen(false); }}
      className={`text-lg font-medium hover:text-primary-600 dark:hover:text-primary-400 transition ${page === to ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'}`}
    >
      {label}
    </button>
  );

  const FooterLink = ({ to, label }: { to: PageRoute, label: string }) => (
    <button onClick={() => setPage(to)} className="text-sm text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition">
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary-100 selection:text-primary-900">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage('home')}>
              <div className="bg-gradient-to-tr from-primary-600 to-secondary-500 p-2 rounded-lg text-white">
                <Calculator size={24} />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                TechyStudent
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <NavLink to="home" label="Solver" />
              <NavLink to="about" label="About" />
              <NavLink to="contact" label="Contact" />
              
              <button 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
               <button 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-600 dark:text-gray-300">
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {menuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-2">
            <NavLink to="home" label="Home" />
            <NavLink to="about" label="About Us" />
            <NavLink to="contact" label="Contact" />
            <NavLink to="privacy" label="Privacy Policy" />
            <NavLink to="terms" label="Terms & Conditions" />
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {page === 'home' ? (
          <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            
            {/* Hero Section */}
            {!result && (
              <div className="text-center mb-12 animate-in fade-in zoom-in duration-500">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
                  Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">Homework</span> with AI
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
                  Instant step-by-step solutions for Math, Physics, and Chemistry. Upload a photo or type your question. Free & Fast.
                </p>
                <div className="flex justify-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><BookOpen size={16} className="text-primary-500" /> Math</span>
                  <span className="flex items-center gap-1"><Beaker size={16} className="text-secondary-500" /> Chemistry</span>
                  <span className="flex items-center gap-1"><Zap size={16} className="text-yellow-500" /> Physics</span>
                </div>
              </div>
            )}

            {/* Solver Interface */}
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-500 ${result ? 'mt-4' : ''}`}>
              
              {/* Input Section - Hide if solving or result is showing (optional, keeping visible for now for UX but simplified) */}
              {solveStatus === SolveStatus.IDLE && (
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Image Upload Area */}
                  <div 
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer group ${
                      selectedImage 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                    />
                    
                    {selectedImage ? (
                      <div className="relative h-48 w-full flex items-center justify-center">
                        <img src={selectedImage} alt="Upload" className="h-full object-contain rounded-lg shadow-sm" />
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="mx-auto h-16 w-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                          <Camera size={32} />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                            Drop an image here or click to upload
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Supports JPG, PNG, WEBP
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR TYPE QUESTION</span>
                    <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                  </div>

                  {/* Text Input */}
                  <div>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type your Math, Physics, or Chemistry question here..."
                      className="w-full h-32 p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition"
                    />
                  </div>

                  {/* Options */}
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Spanish">Spanish</option>
                    </select>

                    <button 
                      onClick={handleSolve}
                      disabled={!inputText && !selectedImage}
                      className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Zap size={20} />
                      Solve Now
                    </button>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {(solveStatus === SolveStatus.ANALYZING || solveStatus === SolveStatus.SOLVING) && (
                <div className="p-12 text-center">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Calculator className="text-primary-500 animate-pulse" size={24} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {solveStatus === SolveStatus.ANALYZING ? "Scanning Question..." : "AI Computing Solution..."}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Please wait while we crunch the numbers.
                  </p>
                </div>
              )}

              {/* Result State */}
              {solveStatus === SolveStatus.COMPLETED && parsedData && (
                <div className="solution-container relative bg-white dark:bg-gray-800 animate-in fade-in slide-in-from-bottom-4">
                  
                  {/* Result Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 no-print">
                     <button 
                      onClick={resetForm}
                      className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      <ChevronRight className="rotate-180" size={16} />
                      New Question
                    </button>
                    <div className="flex gap-2">
                      <button onClick={handleShare} className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition" title="Share Link">
                        <Share2 size={18} />
                      </button>
                      <button onClick={handleDownloadPDF} className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg flex items-center gap-2 transition" title="Print / Save PDF">
                        <Download size={18} />
                        <span className="hidden sm:inline text-xs font-semibold">PDF</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                     {/* Disclaimer in Result */}
                    <div className="mb-6 flex gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/30 text-xs text-yellow-800 dark:text-yellow-200 print-only">
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <p>AI-generated content. Verify steps before submission. For educational use only.</p>
                    </div>

                    {parsedData.fallback ? (
                      // Fallback for unstructured response
                      <div className="prose dark:prose-invert max-w-none prose-headings:text-primary-700 dark:prose-headings:text-primary-400 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-code:bg-gray-100 dark:prose-code:bg-gray-700 prose-code:text-primary-600 dark:prose-code:text-primary-300 prose-pre:bg-gray-900 prose-pre:text-gray-100">
                        <ReactMarkdown>{result}</ReactMarkdown>
                      </div>
                    ) : (
                      // Structured Result View
                      <div className="space-y-8">
                        
                        {/* Ad in content */}
                        <AdPlaceholder slot={adConfig.slots.content} label="Sponsored" className="mb-6 mt-0" />

                        {/* Steps */}
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                             <span className="bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 p-1.5 rounded-lg"><BookOpen size={20}/></span>
                             Step-by-Step Solution
                          </h3>
                          
                          <div className="space-y-6">
                            {parsedData.steps.map((step, index) => (
                              <div key={index} className="group relative bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5 border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700/50 transition-all">
                                <div className="flex justify-between items-start mb-3">
                                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs">{index + 1}</span>
                                    {step.title}
                                  </h4>
                                  <CopyButton text={`Step ${index + 1}: ${step.title}\n${step.content}`} />
                                </div>
                                <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                                  <ReactMarkdown>{step.content}</ReactMarkdown>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Final Answer */}
                        <div className="mt-8">
                          <div className="bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-800 border border-primary-100 dark:border-primary-900/50 rounded-xl p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="text-lg font-bold text-primary-700 dark:text-primary-400 flex items-center gap-2">
                                <CheckCircle size={20} />
                                Final Answer
                              </h3>
                              <CopyButton text={parsedData.finalAnswer} />
                            </div>
                            <div className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white prose dark:prose-invert max-w-none">
                              <ReactMarkdown>{parsedData.finalAnswer}</ReactMarkdown>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                  </div>
                </div>
              )}

               {/* Error State */}
               {solveStatus === SolveStatus.ERROR && (
                 <div className="p-8 text-center">
                   <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 mb-4">
                     <AlertCircle size={32} />
                   </div>
                   <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Oops! Something went wrong.</h3>
                   <p className="text-gray-600 dark:text-gray-300 mb-6">{result}</p>
                   <button 
                    onClick={resetForm}
                    className="px-6 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:opacity-90"
                   >
                     Try Again
                   </button>
                 </div>
               )}
            </div>

            {/* Sidebar Ad */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
               <AdPlaceholder slot={adConfig.slots.sidebar} className="h-32" />
               <AdPlaceholder slot={adConfig.slots.bottom} className="h-32" />
            </div>

          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4">
             {page === 'about' && <AboutPage />}
             {page === 'contact' && <ContactPage />}
             {page === 'privacy' && <PrivacyPolicy />}
             {page === 'terms' && <TermsConditions />}
             {page === 'disclaimer' && <Disclaimer />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary-600 p-1.5 rounded-md text-white">
                  <Calculator size={20} />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">TechyStudent</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                Empowering students with instant, accurate, and explained solutions for a brighter academic future.
              </p>
              <div className="flex gap-4">
                {/* Social placeholders */}
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-primary-500 cursor-pointer transition"><Share2 size={16} /></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
              <div className="flex flex-col gap-2 items-start">
                <FooterLink to="privacy" label="Privacy Policy" />
                <FooterLink to="terms" label="Terms & Conditions" />
                <FooterLink to="disclaimer" label="Disclaimer" />
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h4>
              <div className="flex flex-col gap-2 items-start">
                <FooterLink to="about" label="About Us" />
                <FooterLink to="contact" label="Contact" />
                <button 
                  onClick={() => setShowAdConfig(!showAdConfig)}
                  className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mt-2"
                >
                  <Settings size={12} /> <span className="text-xs">Config</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} TechyStudent. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Admin Config Modal (Hidden/Discreet) */}
      {showAdConfig && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Site Configuration</h3>
              <button onClick={() => setShowAdConfig(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">AdSense Publisher ID</label>
                <input 
                  type="text" 
                  value={adConfig.publisherId} 
                  onChange={(e) => setAdConfig({...adConfig, publisherId: e.target.value})}
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-400">
                This is a demo configuration panel. In a real deployment, these values would be stored in environment variables or a database.
              </p>
              <button 
                onClick={() => setShowAdConfig(false)}
                className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;