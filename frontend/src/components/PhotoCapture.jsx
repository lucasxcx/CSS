import { useEffect, useRef, useState } from "react";
import FeedbackBanner from "./FeedbackBanner";

function PhotoCapture({ onCapture }) {
  const [photoData, setPhotoData] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = () => {
    if (!streamRef.current) {
      return;
    }

    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setCameraError("");
    setIsStartingCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError("Não foi possível acessar a câmera neste dispositivo.");
    } finally {
      setIsStartingCamera(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageAsBase64 = canvas.toDataURL("image/jpeg", 0.9);
    setPhotoData(imageAsBase64);
    onCapture(imageAsBase64);
    stopCamera();
  };

  const clearPhoto = () => {
    setPhotoData(null);
    onCapture(null);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">Foto da entrega *</h3>

      {photoData ? (
        <div className="space-y-3">
          <img
            className="w-full rounded-xl border border-slate-200 object-cover"
            src={photoData}
            alt="Foto registrada da entrega"
          />
          <button className="btn-secondary w-full" type="button" onClick={clearPhoto}>
            Tirar nova foto
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <video
            className="min-h-44 w-full rounded-xl border border-dashed border-slate-300 bg-slate-200 object-cover"
            ref={videoRef}
            autoPlay
            muted
            playsInline
          />
          <canvas className="hidden" ref={canvasRef} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              className="btn-secondary"
              type="button"
              onClick={startCamera}
              disabled={isStartingCamera}
            >
              {isStartingCamera ? "Abrindo câmera..." : "Abrir câmera"}
            </button>
            <button className="btn-primary" type="button" onClick={capturePhoto}>
              Capturar foto
            </button>
          </div>
          <FeedbackBanner type="error" message={cameraError} />
        </div>
      )}
    </section>
  );
}

export default PhotoCapture;
