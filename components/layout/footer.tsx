export function Footer() {
  return (
    <footer className="border-t py-4 px-6">
      <div className="text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Buildify. Tous droits réservés.
      </div>
    </footer>
  );
}
