export function applyTheme(prefs){
  if(prefs.theme === 'dark'){
    document.documentElement.classList.add('dark');
  }else{
    document.documentElement.classList.remove('dark');
  }
}
