export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container flex h-12 sm:h-14 items-center justify-center px-4 text-xs sm:text-sm text-muted-foreground">
        <p className="text-center">
          © {new Date().getFullYear()}. Powered by{' '}
          <a
            href="https://internetcomputer.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            Internet Computer
          </a>
        </p>
      </div>
    </footer>
  );
}
