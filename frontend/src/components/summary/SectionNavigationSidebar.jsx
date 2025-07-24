import { useState, useEffect } from 'react';

function SectionNavigationSidebar({ sections }) {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <nav className="card p-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">On this page</h3>
      <ul className="space-y-1">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              onClick={() => scrollToSection(section.id)}
              className={`
                w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200
                ${activeSection === section.id
                  ? 'bg-primary-50 text-primary-700 font-medium border-l-4 border-primary-500 pl-3'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {section.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default SectionNavigationSidebar;