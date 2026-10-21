import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="py-16">
      <p className="num mb-4 text-[12.5px] uppercase tracking-[0.12em] text-neutral-500">404</p>
      <h1 className="text-[56px] font-black leading-[0.95] tracking-[-0.045em]">Nothing here.</h1>
      <p className="mt-4 max-w-md text-[17px] text-neutral-600">This page isn&apos;t part of the demo. Everything Keel is working on is one click away.</p>
      <ButtonLink href="/" variant="primary" size="lg" className="mt-8">
        Back to Today
      </ButtonLink>
    </div>
  );
}
