import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // --- 1. STATE MANAGEMENT ---
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // Default values for form inputs
  const [formData, setFormData] = useState({
    A1: 0, A2: 0, A3: 0, A4: 0, A5: 0, 
    A6: 0, A7: 0, A8: 0, A9: 0, A10: 0,
    Age: 24, Sex: 1, Jaundice: 0, FamHx: 0
  });

  // --- 2. HANDLERS ---
  const handleChange = (e) => {
    // Convert string inputs to numbers immediately
    setFormData({ ...formData, [e.target.name]: Number(e.target.value) });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please upload a child's facial image.");
    
    setLoading(true);
    setResult(null); // Clear previous results
    
    // Prepare Data for Backend
    const data = new FormData();
    data.append('file', file);
    data.append('patient_data', JSON.stringify(formData));

    try {
      // ✅ CONNECTS TO YOUR LIVE HUGGING FACE API
      const response = await axios.post(
        'https://sumoy47-autism-detection-api.hf.space/predict', 
        data
      );
      setResult(response.data);
    } catch (error) {
      console.error(error);
      // ✅ Updated Error Message for Production
      setResult({ error: "Server is busy or starting up. Please wait 1 minute and try again." });
    }
    setLoading(false);
  };

  // --- 3. UI RENDER ---
  return (
    <div className="App">
      <header className="header">
        <h1>D-ASD Clinical Dashboard</h1>
        <p>Multimodal Autism Screening System</p>
      </header>

      <div className="container">
        
        {/* LEFT COLUMN: INPUT FORM */}
        <div className="card input-section">
          <h2>1. Clinical Data</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid-container">
              {/* Generate A1-A10 Dropdowns dynamically */}
              {[...Array(10)].map((_, i) => (
                <div key={i} className="form-group">
                  <label>A{i+1} Score</label>
                  <select name={`A${i+1}`} onChange={handleChange}>
                    <option value="0">0</option>
                    <option value="1">1</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="grid-container">
              <div className="form-group">
                <label>Age (Months)</label>
                <input type="number" name="Age" value={formData.Age} onChange={handleChange} min="1" max="100" />
              </div>
              <div className="form-group">
                <label>Sex</label>
                <select name="Sex" onChange={handleChange}>
                  <option value="1">Male</option>
                  <option value="0">Female</option>
                </select>
              </div>
              <div className="form-group">
                <label>Jaundice</label>
                <select name="Jaundice" onChange={handleChange}>
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
              <div className="form-group">
                <label>Family Hx</label>
                <select name="FamHx" onChange={handleChange}>
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
            </div>

            <h2>2. Facial Scan</h2>
            <div className="upload-box">
              <input type="file" onChange={handleFileChange} accept="image/*" />
            </div>
            {preview && <img src={preview} alt="Preview" className="img-preview" />}

            <button type="submit" disabled={loading} className="analyze-btn">
              {loading ? "Analyzing..." : "RUN SCREENING"}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: RESULTS */}
        <div className="card result-section">
          <h2>3. Diagnosis & XAI</h2>
          
          {/* A. Loading State */}
          {loading && <div className="placeholder animate-pulse">Running Neural Models...</div>}

          {/* B. Error State */}
          {!loading && result && result.error && (
            <div className="diagnosis-box" style={{background: '#e74c3c'}}>
              <h3>SYSTEM ERROR</h3>
              <p>{result.error}</p>
            </div>
          )}

          {/* C. Success State */}
          {!loading && result && result.diagnosis && (
            <div className="fade-in">
              {/* Diagnosis Box */}
              <div className={`diagnosis-box ${result.diagnosis === 'Autistic' ? 'risk' : 'safe'}`}>
                <h3>{result.diagnosis.toUpperCase()}</h3>
                
                {/* CONFIDENCE LOGIC */}
                <p>
                  Confidence: {
                    result.diagnosis === 'Autistic' 
                      ? (result.risk_score * 100).toFixed(1) 
                      : ((1 - result.risk_score) * 100).toFixed(1)
                  }%
                </p>
              </div>

              {/* Explainable AI Image */}
              <h4>Visual Attribution (Grad-CAM)</h4>
              <div className="xai-container">
                <img src={result.xai_image} alt="Grad-CAM Heatmap" className="xai-img" />
              </div>
              <p className="note">
                *Heatmap highlights facial features (eyes/mouth/philtrum) influencing the model's decision.
              </p>
            </div>
          )}

          {/* D. Empty State */}
          {!loading && !result && (
            <div className="placeholder">
              <p>Waiting for patient data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;