export default function Footer() {
  return (
    <footer className="bg-navy py-10 text-[13px] leading-[1.6] font-medium text-mist">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-2.5 px-5 desk:flex-row desk:justify-between desk:gap-10 desk:px-10">
        <p>
          © 2026 Oravie Dental Studio. Oravie is a concept brand created for a portfolio project. Noor does not give
          medical advice.
        </p>
        <p>
          <a
            href="https://unsplash.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:text-white hover:underline"
            title="Photos by D Dental Office, Kari Bjorn Photography, Caroline LM, rawkkim, Benyamin Bohlouli and Katarzyna Zygnerska"
          >
            Photos from Unsplash
          </a>
        </p>
      </div>
    </footer>
  );
}
