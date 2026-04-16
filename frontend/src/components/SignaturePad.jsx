import { useEffect, useRef, useState } from "react";

function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  const configureCanvas = () => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;

    if (!canvas || !wrapper) {
      return;
    }

    canvas.width = wrapper.clientWidth;
    canvas.height = 180;

    const context = canvas.getContext("2d");
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#0f172a";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const getCoordinates = (event) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    canvas.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    const { x, y } = getCoordinates(event);
    context.beginPath();
    context.moveTo(x, y);
  };

  const handlePointerMove = (event) => {
    if (!isDrawingRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const { x, y } = getCoordinates(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const emitSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const image = canvas.toDataURL("image/png");
    onChange(image);
    setHasSignature(true);
  };

  const handlePointerUp = (event) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(event.pointerId);
    }

    if (!isDrawingRef.current) {
      return;
    }

    isDrawingRef.current = false;
    emitSignature();
  };

  const clearSignature = () => {
    configureCanvas();
    setHasSignature(false);
    onChange(null);
  };

  useEffect(() => {
    configureCanvas();
    const onResize = () => configureCanvas();

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Assinatura (opcional)</h3>
        <button className="text-xs font-semibold text-blue-700" type="button" onClick={clearSignature}>
          Limpar
        </button>
      </div>
      <div className="w-full" ref={wrapperRef}>
        <canvas
          className="touch-none rounded-xl border border-dashed border-slate-300 bg-white"
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {hasSignature ? "Assinatura capturada." : "Assinatura não preenchida."}
      </p>
    </section>
  );
}

export default SignaturePad;
