/**
 * Applies the stored or system theme before first paint so the public
 * site does not flash the wrong board.
 */
export function ThemeScript() {
  const source = `(function(){
    try {
      var stored = localStorage.getItem('pref.theme');
      var theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
      var dark = theme === 'dark' || (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    } catch (e) {}
  })();`;

  return <script dangerouslySetInnerHTML={{ __html: source }} />;
}
