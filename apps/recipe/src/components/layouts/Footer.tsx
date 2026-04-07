export default function Footer(): JSX.Element {
  return (
    <footer className="relative overflow-hidden px-4 py-5 text-center md:py-8">
      Copyright &copy; {new Date().getFullYear()}
      <a
        className="transition-colors duration-150 ease-in-out hover:text-[#a73f3f]"
        href="https://github.com/howard86"
        rel="noopener noreferrer"
        target="_blank"
      >
        Howard86
      </a>
    </footer>
  );
}
