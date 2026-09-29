import HomeTools from '@/components/HomeTools';

export default function Home() {
  return (
    <>
      <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
        Fix any PDF without uploading it anywhere.
      </h1>
      <p className="muted mt-4 mb-8 max-w-xl text-lg">
        Merge, split, crop, rotate and more. Everything runs in your browser, so your documents stay on your device. No sign-up.
      </p>
      <HomeTools />
    </>
  );
}
