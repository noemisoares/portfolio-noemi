async function loadComponents() {
    const components = [
        { id: 'navbar-placeholder', url: 'components/navbar.html' },
        { id: 'hero-placeholder', url: 'components/hero.html' },
        { id: 'ticker-placeholder', url: 'components/ticker.html' },
        { id: 'about-placeholder', url: 'components/about.html' },
        { id: 'skills-placeholder', url: 'components/skills.html' },
        { id: 'projects-placeholder', url: 'components/projects.html' },
        { id: 'contact-placeholder', url: 'components/contact.html' },
        { id: 'footer-placeholder', url: 'components/footer.html' }
    ];

    for (const comp of components) {
        try {
            const response = await fetch(comp.url);
            if (response.ok) {
                const html = await response.text();
                const container = document.getElementById(comp.id);
                if (container) {
                    container.outerHTML = html;
                }
            } else {
                console.error(`Erro ao carregar o componente ${comp.url}: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Erro ao carregar o componente ${comp.url}:`, error);
        }
    }

    if (typeof initAnimations === 'function') {
        initAnimations();
    }

    if (typeof initLion3D === 'function') {
        initLion3D();
    }
}

document.addEventListener('DOMContentLoaded', loadComponents);
