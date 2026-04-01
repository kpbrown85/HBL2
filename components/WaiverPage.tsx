import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { CheckCircle2, ShieldAlert, PenTool, Download, ArrowLeft, Loader2 } from 'lucide-react';

interface WaiverPageProps {
  bookingId: string;
  onComplete: () => void;
}

export const WaiverPage: React.FC<WaiverPageProps> = ({ bookingId, onComplete }) => {
  const [isSigned, setIsSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sigPad = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (!bookingId) {
      setError("No Booking ID provided. Please use the link from your confirmation email.");
    }
  }, [bookingId]);

  const clear = () => {
    sigPad.current?.clear();
    setIsSigned(false);
  };

  const save = async () => {
    if (sigPad.current?.isEmpty()) {
      alert("Please provide a signature.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Try to get trimmed canvas, fallback to raw canvas if it fails (common in some build environments)
      let canvas;
      try {
        canvas = sigPad.current?.getTrimmedCanvas();
      } catch (e) {
        console.warn("getTrimmedCanvas failed, falling back to raw canvas", e);
        canvas = sigPad.current?.getCanvas();
      }
      
      if (!canvas) {
        throw new Error("Could not capture signature canvas");
      }

      const signatureData = canvas.toDataURL('image/png');
      const response = await fetch(`${window.location.origin}/api/sign-waiver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, signatureData })
      });

      if (response.ok) {
        setIsSigned(true);
        setTimeout(onComplete, 3000);
      } else {
        const data = await response.json();
        throw new Error(data.details || data.error || "Failed to save signature");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSigned) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-8">
        <div className="bg-white p-16 rounded-[4rem] shadow-2xl max-w-lg w-full text-center space-y-8 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-midnight/5 text-gold rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tighter">Agreement Signed</h2>
          <p className="text-stone-500 font-medium leading-relaxed">
            Thank you. Your Rental Agreement and Liability Waiver has been electronically signed and recorded. We will be in touch shortly to finalize your expedition.
          </p>
          <button 
            onClick={onComplete}
            className="w-full py-6 bg-stone-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-black transition-all"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-40 pb-24 px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-stone-900 leading-none mb-4">Rental Agreement.</h1>
            <p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-[10px]">Helena Backcountry Llamas, LLC / Liability Waiver</p>
          </div>
          <button onClick={onComplete} className="flex items-center gap-3 text-stone-400 font-black text-[10px] uppercase tracking-widest hover:text-stone-900 transition-colors">
            <ArrowLeft size={16} /> Cancel
          </button>
        </header>

        <div className="bg-white rounded-[4rem] shadow-xl border border-stone-100 overflow-hidden">
          <div className="p-12 md:p-20 space-y-12 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="prose prose-stone max-w-none space-y-8 text-stone-600 font-medium leading-relaxed">
              <section className="space-y-4">
                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">1. Lease Terms</h3>
                <p>Helena Backcountry Llamas, LLC (“Lessor”) agrees to lease to the Customer (“Lessee”) llama(s) and equipment, tack and trailer upon the following terms and conditions:</p>
                <p>Upon taking possession of these llama(s), I understand and agree to assume full liability and responsibility for the animal(s). I will be my own guide and provide food and water in sufficient quantity so as to return the animal(s) in the same or better condition as when I received them.</p>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">2. Responsibility for Condition</h3>
                <p>I completely understand and agree I’m responsible for the llama(s) well-being, the equipment, tack and trailers I lease and are in my possessions. Lessor or its designated agent shall be the sole judge of condition.</p>
                <p>In the event that the animal(s) are injured or cannot be returned in the same condition as when I received then, I shall remit a sum of five thousand dollars ($5000.00) for each animal in said condition. In the event a llama is lost I will reimburse Lessor a $300 per diem until the Llama is found or loss equals six thousand dollars ($6,000). For each dead, totally disabled or missing animal I agree to pay the sum of six thousand dollars ($6,000).</p>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">3. Replacement Rates</h3>
                <div className="grid grid-cols-2 gap-4 text-sm bg-stone-50 p-8 rounded-3xl">
                  <div>Pack Llama: $6,000.00</div>
                  <div>Stock Trailer: $10,000.00</div>
                  <div>Saddle: $625.00</div>
                  <div>Panniers: $350.00</div>
                  <div>Halters: $35.00</div>
                  <div>Lead Rope: $35.00</div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">4. Release of Liability</h3>
                <p>In consideration of participating in the Activity, I waive and release my rights to file a claim or lawsuit against Helena Backcountry Llamas, LLC, employees, agents, volunteers, successors, assigns, the State of Montana, the State of Idaho, and the State of Wyoming, if any, from all claims for any liability, injury, loss, or damage resulting from the use of the llama(s) by me or members of my party.</p>
                <p>I understand fully the responsibility associated with the use of the llama(s) and assume total responsibility for the terms and conditions of this Llama Lease Agreement.</p>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">5. Acknowledgement of Risk</h3>
                <p>Risks inherent to animal activities means dangers or conditions that are an integral part of the animal activities, including but not limited to: the propensity of an animal to behave in ways that may result in injury, harm or death; unpredictability of reactions to sounds, sudden movement, or unfamiliar objects; hazards of surface and subsurface ground conditions; and collisions with other animals or objects.</p>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">6. Controlling Law</h3>
                <p>Any controversy or claim arising out of or relating to this Agreement shall be governed by Montana law. Any lawsuit filed as a result of my visit with Helena Backcountry Llamas, LLC shall be filed in federal court in Billings, Montana.</p>
              </section>
            </div>
          </div>

          <div className="p-12 md:p-20 bg-stone-50 border-t border-stone-100 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-2 text-center md:text-left">
                <h4 className="text-2xl font-black text-stone-900 tracking-tight">Electronic Signature</h4>
                <p className="text-stone-400 font-bold text-xs uppercase tracking-widest">Sign within the box below</p>
              </div>
              <button 
                onClick={clear}
                className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-red-600 transition-colors"
              >
                Clear Signature
              </button>
            </div>

            <div className="bg-white rounded-3xl border-2 border-stone-200 overflow-hidden h-64 relative shadow-inner">
              <SignatureCanvas 
                ref={sigPad}
                penColor="#1c1917"
                canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                onEnd={() => setIsSigned(false)}
              />
              <div className="absolute bottom-4 right-4 pointer-events-none opacity-20">
                <PenTool size={24} />
              </div>
            </div>

            {error && (
              <div className="p-8 bg-red-50 text-red-600 rounded-[2rem] border border-red-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-4">
                  <ShieldAlert size={24} />
                  <p className="text-lg font-black uppercase tracking-tight">Signature Failed</p>
                </div>
                <p className="text-sm font-medium leading-relaxed opacity-80">{error}</p>
                <div className="pt-4 border-t border-red-200/50">
                  <p className="text-[10px] font-black uppercase tracking-widest">Troubleshooting:</p>
                  <ul className="list-disc list-inside text-[10px] mt-2 space-y-1 opacity-60">
                    <li>Ensure you clicked the link from your most recent email</li>
                    <li>If the server recently restarted, local records may have been cleared</li>
                    <li>Contact us at 801-372-0353 if you cannot complete signing</li>
                  </ul>
                </div>
              </div>
            )}

            <button 
              onClick={save}
              disabled={isSubmitting || !!(error && error.includes("No Booking ID"))}
              className="w-full py-8 bg-midnight text-white rounded-[2rem] font-black text-lg uppercase tracking-[0.2em] shadow-2xl shadow-midnight/20 hover:bg-midnight/90 transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <ShieldAlert size={24} />}
              {isSubmitting ? "Recording Agreement..." : "I Accept & Sign Agreement"}
            </button>

            <p className="text-center text-[9px] font-black uppercase tracking-[0.3em] text-stone-400">
              By signing above, you agree to the terms of the Helena Backcountry Llamas Rental Agreement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
