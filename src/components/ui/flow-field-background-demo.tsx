import NeuralBackground from "@/components/ui/flow-field-background";

export default function NeuralHeroDemo() {
  return (
    <div className="relative h-screen w-full">
      <NeuralBackground
        color="#818cf8"
        trailOpacity={0.1}
        particleCount={700}
        speed={0.8}
      />
    </div>
  );
}
