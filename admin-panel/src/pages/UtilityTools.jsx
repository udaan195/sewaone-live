import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// --- NEW LIBRARY ---
import imageCompression from 'browser-image-compression';
import jsPDF from 'jspdf';
import './AdminDashboard.css';
import './UtilityTools.css';

export default function UtilityTools({ onLogout }) {
  const [activeTab, setActiveTab] = useState('resize');

  // --- STATES ---
  // Resizer
  const [resizeFile, setResizeFile] = useState(null);
  const [targetSizeKB, setTargetSizeKB] = useState(50); // Target KB
  const [maxWidth, setMaxWidth] = useState(1920); // Default HD Width
  const [isProcessing, setIsProcessing] = useState(false);
  const [resizedImage, setResizedImage] = useState(null);
  const [finalSize, setFinalSize] = useState(0);

  // PDF
  const [pdfImages, setPdfImages] = useState([]);
  
  // Age Calc
  const [dob, setDob] = useState('');
  const [asOnDate, setAsOnDate] = useState(new Date().toISOString().split('T')[0]);
  const [ageResult, setAgeResult] = useState(null);

  // --- LOGIC: SMART COMPRESSOR ---
  const handleResize = async () => {
      if (!resizeFile) return alert("Select image!");
      setIsProcessing(true);

      try {
          // Options set karein
          const options = {
            maxSizeMB: targetSizeKB / 1024, // KB to MB conversion
            maxWidthOrHeight: parseInt(maxWidth), // Resolution control
            useWebWorker: true, // Fast processing
            fileType: "image/jpeg", // Output format
            initialQuality: 0.9 // Start with high quality
          };

          // Magic happens here
          const compressedFile = await imageCompression(resizeFile, options);
          
          // Size check
          setFinalSize((compressedFile.size / 1024).toFixed(2));

          // File to URL for preview/download
          const downloadUrl = URL.createObjectURL(compressedFile);
          setResizedImage(downloadUrl);

      } catch (error) {
          console.log(error);
          alert("Compression failed. Try a larger size.");
      } finally {
          setIsProcessing(false);
      }
  };

  // --- LOGIC: IMAGE TO PDF ---
  const handleConvertToPDF = () => {
      if (pdfImages.length === 0) return alert("Select images!");
      
      const doc = new jsPDF();
      
      pdfImages.forEach((img, index) => {
          if (index > 0) doc.addPage();
          const imgProps = doc.getImageProperties(img);
          const pdfWidth = doc.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          doc.addImage(img, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      });
      
      doc.save("SewaOne_Doc.pdf");
  };

  const handlePdfImageSelect = (e) => {
      const files = Array.from(e.target.files);
      Promise.all(files.map(file => {
          return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result);
              reader.onerror = error => reject(error);
          });
      })).then(images => setPdfImages([...pdfImages, ...images]));
  };

  // --- LOGIC: AGE CALCULATOR ---
  const calculateAge = () => {
      if (!dob || !asOnDate) return;
      const birth = new Date(dob);
      const target = new Date(asOnDate);
      
      let years = target.getFullYear() - birth.getFullYear();
      let months = target.getMonth() - birth.getMonth();
      let days = target.getDate() - birth.getDate();

      if (days < 0) {
          months--;
          const lastMonth = new Date(target.getFullYear(), target.getMonth(), 0);
          days += lastMonth.getDate();
      }
      if (months < 0) {
          years--;
          months += 12;
      }
      setAgeResult(`${years} Years, ${months} Months, ${days} Days`);
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav"><div className="nav-content"><span className="nav-title">⚡ Utility Tools</span><button onClick={onLogout} className="logout-button">Logout</button></div></nav>
      
      <main className="dashboard-main">
         <Link to="/" className="back-link">&larr; Dashboard</Link>

         {/* TABS */}
         <div className="tools-tabs">
             <button className={activeTab==='resize'?'active':''} onClick={()=>setActiveTab('resize')}>🖼️ Smart Compressor</button>
             <button className={activeTab==='pdf'?'active':''} onClick={()=>setActiveTab('pdf')}>📄 IMG to PDF</button>
             <button className={activeTab==='age'?'active':''} onClick={()=>setActiveTab('age')}>📅 Age Calculator</button>
             <button className={activeTab==='passport'?'active':''} onClick={()=>setActiveTab('passport')}>👤 Passport Maker</button>
         </div>

         {/* --- TOOL 1: SMART COMPRESSOR --- */}
         {activeTab === 'resize' && (
             <div className="tool-card">
                 <h3>HD Image Compressor</h3>
                 <p>Reduce file size without losing visible quality.</p>
                 
                 <div className="tool-grid">
                     <div className="tool-input-area">
                         <label>Select Image</label>
                         <input type="file" accept="image/*" onChange={(e)=>{setResizeFile(e.target.files[0]); setResizedImage(null);}} />
                         
                         <div className="row-inputs">
                             <div>
                                 <label>Target Size (KB)</label>
                                 <input type="number" value={targetSizeKB} onChange={e=>setTargetSizeKB(e.target.value)} placeholder="Ex: 50"/>
                                 <small style={{color:'#666'}}>We will try to reach this size.</small>
                             </div>
                             <div>
                                 <label>Max Resolution (Optional)</label>
                                 <select value={maxWidth} onChange={e=>setMaxWidth(e.target.value)}>
                                     <option value={1920}>Full HD (Original)</option>
                                     <option value={1280}>HD (Good for Web)</option>
                                     <option value={800}>Standard (Forms)</option>
                                     <option value={400}>Thumbnail</option>
                                 </select>
                             </div>
                         </div>

                         <button className="action-btn-main" onClick={handleResize} disabled={isProcessing}>
                             {isProcessing ? 'Compressing...' : 'Compress Image'}
                         </button>
                     </div>

                     <div className="tool-preview-area">
                         {isProcessing && <p>Optimizing pixels...</p>}
                         
                         {!isProcessing && resizedImage && (
                             <>
                                <div style={{marginBottom:10, background:'#dcfce7', padding:'5px 10px', borderRadius:20, color:'green', fontWeight:'bold'}}>
                                    Done: {finalSize} KB
                                </div>
                                <img src={resizedImage} alt="Result" className="preview-img"/>
                                <a href={resizedImage} download={`compressed_image.jpg`} className="download-btn">⬇ Download HD Image</a>
                             </>
                         )}
                         
                         {!isProcessing && !resizedImage && <div className="placeholder">Preview will appear here</div>}
                     </div>
                 </div>
             </div>
         )}

         {/* --- TOOL 2: IMG TO PDF --- */}
         {activeTab === 'pdf' && (
             <div className="tool-card">
                 <h3>Image to PDF Converter</h3>
                 <p>Combine multiple documents into one PDF.</p>
                 <input type="file" multiple accept="image/*" onChange={handlePdfImageSelect} />
                 <div className="pdf-preview-grid">
                     {pdfImages.map((img, i) => (<img key={i} src={img} alt="doc" className="thumb-img"/>))}
                 </div>
                 {pdfImages.length > 0 && <button className="action-btn-main" onClick={handleConvertToPDF} style={{marginTop:20}}>Generate PDF</button>}
             </div>
         )}

         {/* --- TOOL 3: AGE CALCULATOR --- */}
         {activeTab === 'age' && (
             <div className="tool-card" style={{maxWidth: 500}}>
                 <h3>Age Calculator</h3>
                 <div className="form-group"><label>Date of Birth</label><input type="date" value={dob} onChange={e=>setDob(e.target.value)} style={{width:'100%', padding:10}}/></div>
                 <div className="form-group"><label>Age As On</label><input type="date" value={asOnDate} onChange={e=>setAsOnDate(e.target.value)} style={{width:'100%', padding:10}}/></div>
                 <button className="action-btn-main" onClick={calculateAge}>Calculate</button>
                 {ageResult && <div className="result-box"><h4>Your Age:</h4><h2>{ageResult}</h2></div>}
             </div>
         )}

         {/* --- TOOL 4: PASSPORT MAKER --- */}
         {activeTab === 'passport' && (
             <div className="tool-card">
                 <h3>Passport Photo Maker</h3>
                 <p>Make any photo 3.5cm x 4.5cm compatible.</p>
                 <input type="file" accept="image/*" onChange={async (e)=>{
                     // Smart Passport Logic
                     const file = e.target.files[0];
                     if(!file) return;
                     try {
                        const compressed = await imageCompression(file, {
                            maxSizeMB: 0.05, // 50kb limit for passport
                            maxWidthOrHeight: 450, // Standard Height
                            useWebWorker: true
                        });
                        setResizedImage(URL.createObjectURL(compressed));
                        setFinalSize((compressed.size/1024).toFixed(2));
                        setActiveTab('resize'); // Show result in resize tab
                        alert("Photo optimized for Passport size (450px height, <50KB). Download from preview.");
                     } catch(e){alert("Error");}
                 }}/>
             </div>
         )}

      </main>
    </div>
  );
}


