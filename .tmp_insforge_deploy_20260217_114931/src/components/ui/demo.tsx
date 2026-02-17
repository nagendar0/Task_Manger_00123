import { Entropy } from '@/components/ui/entropy';

export function EntropyDemo() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black p-8 text-white">
      <div className="flex flex-col items-center">
        <Entropy className="rounded-lg" />
        <div className="mt-6 text-center">
          <div className="space-y-4 font-mono text-[14px] leading-relaxed">
            <p className="tracking-wide text-gray-400/80 italic">
              &ldquo;Order and chaos dance &mdash;
              <span className="opacity-70">digital poetry in motion.&rdquo;</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { EntropyDemo as default };
