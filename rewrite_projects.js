const fs = require('fs');
let c = fs.readFileSync('src/app/features/projects/projects.component.ts', 'utf8');

// Add getLangColor method to ProjectListComponent if not present
const LANG_COLORS = `
  private LANG_COLORS: Record<string,string> = {
    TypeScript:'#1E88E5',Go:'#43A047',Python:'#43A047',Rust:'#FB8C00',
    CSS:'#E53935',C:'#0A0A0A',JavaScript:'#FDD835',Java:'#E53935',
    Swift:'#E53935',Kotlin:'#1E88E5',Ruby:'#E53935',PHP:'#1E88E5'
  };
  getLangColor(lang: string): string { return this.LANG_COLORS[lang] || '#0A0A0A'; }
`;

// Insert getLangColor before the class closing
if (!c.includes('getLangColor')) {
  c = c.replace(
    "  fork(id: number, e: Event): void {\n    e.stopPropagation();\n    this.projectSvc.fork(id).subscribe(() => {\n      this.toast.success('Project forked!');\n      const user = this.authSvc.getCurrentUser();\n      if (user) this.projectSvc.getByOwner(user.userId).subscribe(p => { this.myProjects = p; this.updateDisplayed(); });\n    });\n  }\n}",
    "  fork(id: number, e: Event): void {\n    e.stopPropagation();\n    this.projectSvc.fork(id).subscribe(() => {\n      this.toast.success('Project forked!');\n      const user = this.authSvc.getCurrentUser();\n      if (user) this.projectSvc.getByOwner(user.userId).subscribe(p => { this.myProjects = p; this.updateDisplayed(); });\n    });\n  }\n" + LANG_COLORS + "\n}"
  );
}

fs.writeFileSync('src/app/features/projects/projects.component.ts', c, 'utf8');
console.log('getLangColor added. Lines:', c.split('\n').length);
