import LanguageTab from './LanguageTab';

export default function BookPageLayout({ children }) {
  return (
<div className="relative max-w-5xl mx-auto rounded-3xl rounded-tr-none shadow-lg bg-white p-6 md:p-12 mt-20 mb-8 min-h-[80vh] flex flex-col border border-gray-200 border-t-0">
      <LanguageTab /> 
      {children}
    </div>
    
  );
}
