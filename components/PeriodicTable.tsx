
import React, { useState, useMemo, useEffect } from 'react';
import { X, ExternalLink, Maximize2, Loader2, ChevronRight, Thermometer, Info } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

// Data Format: [Number, Symbol, Name, Weight, CategoryIndex, Melt(K), Boil(K), Row, Col]
const RAW_DATA: (string | number)[][] = [
  [1,"H","Hydrogen","1.008",0,13.99,20.271,1,1],
  [2,"He","Helium","4.0026",1,0.95,4.222,1,18],
  [3,"Li","Lithium","6.94",2,453.65,1603,2,1],
  [4,"Be","Beryllium","9.0122",3,1560,2742,2,2],
  [5,"B","Boron","10.81",4,2349,4200,2,13],
  [6,"C","Carbon","12.011",5,3800,4300,2,14],
  [7,"N","Nitrogen","14.007",0,63.15,77.355,2,15],
  [8,"O","Oxygen","15.999",0,54.36,90.188,2,16],
  [9,"F","Fluorine","18.998",0,53.48,85.03,2,17],
  [10,"Ne","Neon","20.180",1,24.56,27.104,2,18],
  [11,"Na","Sodium","22.990",2,370.94,1156,3,1],
  [12,"Mg","Magnesium","24.305",3,923,1363,3,2],
  [13,"Al","Aluminium","26.982",6,933.47,2743,3,13],
  [14,"Si","Silicon","28.085",4,1687,3265,3,14],
  [15,"P","Phosphorus","30.974",5,317.3,550,3,15],
  [16,"S","Sulfur","32.06",5,388.36,717.8,3,16],
  [17,"Cl","Chlorine","35.45",0,171.6,239.11,3,17],
  [18,"Ar","Argon","39.948",1,83.81,87.302,3,18],
  [19,"K","Potassium","39.098",2,336.7,1032,4,1],
  [20,"Ca","Calcium","40.078",3,1115,1757,4,2],
  [21,"Sc","Scandium","44.956",7,1814,3109,4,3],
  [22,"Ti","Titanium","47.867",7,1941,3560,4,4],
  [23,"V","Vanadium","50.942",7,2183,3680,4,5],
  [24,"Cr","Chromium","51.996",7,2180,2944,4,6],
  [25,"Mn","Manganese","54.938",7,1519,2334,4,7],
  [26,"Fe","Iron","55.845",7,1811,3134,4,8],
  [27,"Co","Cobalt","58.933",7,1768,3200,4,9],
  [28,"Ni","Nickel","58.693",7,1728,3186,4,10],
  [29,"Cu","Copper","63.546",7,1357.77,2835,4,11],
  [30,"Zn","Zinc","65.38",7,692.68,1180,4,12],
  [31,"Ga","Gallium","69.723",6,302.91,2477,4,13],
  [32,"Ge","Germanium","72.630",4,1211.4,3106,4,14],
  [33,"As","Arsenic","74.922",4,1090,887,4,15],
  [34,"Se","Selenium","78.971",5,494,958,4,16],
  [35,"Br","Bromine","79.904",0,265.8,332,4,17],
  [36,"Kr","Krypton","83.798",1,115.78,119.93,4,18],
  [37,"Rb","Rubidium","85.468",2,312.45,961,5,1],
  [38,"Sr","Strontium","87.62",3,1050,1655,5,2],
  [39,"Y","Yttrium","88.906",7,1799,3609,5,3],
  [40,"Zr","Zirconium","91.224",7,2128,4682,5,4],
  [41,"Nb","Niobium","92.906",7,2750,5017,5,5],
  [42,"Mo","Molybdenum","95.95",7,2896,4912,5,6],
  [43,"Tc","Technetium","98",7,2430,4538,5,7],
  [44,"Ru","Ruthenium","101.07",7,2607,4423,5,8],
  [45,"Rh","Rhodium","102.91",7,2237,3968,5,9],
  [46,"Pd","Palladium","106.42",7,1828.05,3236,5,10],
  [47,"Ag","Silver","107.87",7,1234.93,2435,5,11],
  [48,"Cd","Cadmium","112.41",7,594.22,1040,5,12],
  [49,"In","Indium","114.82",6,429.75,2345,5,13],
  [50,"Sn","Tin","118.71",6,505.08,2875,5,14],
  [51,"Sb","Antimony","121.76",4,903.78,1860,5,15],
  [52,"Te","Tellurium","127.60",4,722.66,1261,5,16],
  [53,"I","Iodine","126.90",0,386.85,457.4,5,17],
  [54,"Xe","Xenon","131.29",1,161.4,165.05,5,18],
  [55,"Cs","Caesium","132.91",2,301.7,944,6,1],
  [56,"Ba","Barium","137.33",3,1000,2118,6,2],
  [57,"La","Lanthanum","138.91",8,1193,3737,6,3],
  [72,"Hf","Hafnium","178.49",7,2506,4876,6,4],
  [73,"Ta","Tantalum","180.95",7,3290,5731,6,5],
  [74,"W","Tungsten","183.84",7,3695,5828,6,6],
  [75,"Re","Rhenium","186.21",7,3459,5869,6,7],
  [76,"Os","Osmium","190.23",7,3306,5285,6,8],
  [77,"Ir","Iridium","192.22",7,2719,4701,6,9],
  [78,"Pt","Platinum","195.08",7,2041.4,4098,6,10],
  [79,"Au","Gold","196.97",7,1337.33,3129,6,11],
  [80,"Hg","Mercury","200.59",7,234.32,629.88,6,12],
  [81,"Tl","Thallium","204.38",6,577,1746,6,13],
  [82,"Pb","Lead","207.2",6,600.61,2022,6,14],
  [83,"Bi","Bismuth","208.98",6,544.7,1837,6,15],
  [84,"Po","Polonium","209",4,527,1235,6,16],
  [85,"At","Astatine","210",4,575,610,6,17],
  [86,"Rn","Radon","222",1,202,211.3,6,18],
  [87,"Fr","Francium","223",2,300,950,7,1],
  [88,"Ra","Radium","226",3,973,2010,7,2],
  [89,"Ac","Actinium","227",9,1323,3471,7,3],
  [104,"Rf","Rutherfordium","267",7,2400,5800,7,4],
  [105,"Db","Dubnium","268",7,null,null,7,5],
  [106,"Sg","Seaborgium","269",7,null,null,7,6],
  [107,"Bh","Bohrium","270",7,null,null,7,7],
  [108,"Hs","Hassium","277",7,null,null,7,8],
  [109,"Mt","Meitnerium","278",10,null,null,7,9],
  [110,"Ds","Darmstadtium","281",10,null,null,7,10],
  [111,"Rg","Roentgenium","282",10,null,null,7,11],
  [112,"Cn","Copernicium","285",7,null,357,7,12],
  [113,"Nh","Nihonium","286",6,700,1400,7,13],
  [114,"Fl","Flerovium","289",6,200,380,7,14],
  [115,"Mc","Moscovium","290",6,670,1400,7,15],
  [116,"Lv","Livermorium","293",6,709,1085,7,16],
  [117,"Ts","Tennessine","294",0,723,883,7,17],
  [118,"Og","Oganesson","294",1,null,350,7,18],
  // Lanthanides
  [58,"Ce","Cerium","140.12",8,1068,3716,9,4],
  [59,"Pr","Praseodymium","140.91",8,1208,3793,9,5],
  [60,"Nd","Neodymium","144.24",8,1297,3347,9,6],
  [61,"Pm","Promethium","145",8,1315,3273,9,7],
  [62,"Sm","Samarium","150.36",8,1345,2067,9,8],
  [63,"Eu","Europium","151.96",8,1099,1802,9,9],
  [64,"Gd","Gadolinium","157.25",8,1585,3546,9,10],
  [65,"Tb","Terbium","158.93",8,1629,3503,9,11],
  [66,"Dy","Dysprosium","162.50",8,1680,2840,9,12],
  [67,"Ho","Holmium","164.93",8,1734,2993,9,13],
  [68,"Er","Erbium","167.26",8,1802,3141,9,14],
  [69,"Tm","Thulium","168.93",8,1818,2223,9,15],
  [70,"Yb","Ytterbium","173.05",8,1097,1469,9,16],
  [71,"Lu","Lutetium","174.97",8,1925,3675,9,17],
  // Actinides
  [90,"Th","Thorium","232.04",9,2115,5061,10,4],
  [91,"Pa","Protactinium","231.04",9,1841,4300,10,5],
  [92,"U","Uranium","238.03",9,1405.3,4404,10,6],
  [93,"Np","Neptunium","237",9,917,4273,10,7],
  [94,"Pu","Plutonium","244",9,912.5,3501,10,8],
  [95,"Am","Americium","243",9,1449,2880,10,9],
  [96,"Cm","Curium","247",9,1613,3383,10,10],
  [97,"Bk","Berkelium","247",9,1259,2900,10,11],
  [98,"Cf","Californium","251",9,1173,1743,10,12],
  [99,"Es","Einsteinium","252",9,1133,1269,10,13],
  [100,"Fm","Fermium","257",9,1125,null,10,14],
  [101,"Md","Mendelevium","258",9,1100,null,10,15],
  [102,"No","Nobelium","259",9,1100,null,10,16],
  [103,"Lr","Lawrencium","266",9,1900,null,10,17],
];

const CATEGORIES = [
  'Diatomic Nonmetal', // 0
  'Noble Gas',         // 1
  'Alkali Metal',      // 2
  'Alkaline Earth',    // 3
  'Metalloid',         // 4
  'Polyatomic Nonmetal',// 5
  'Post-Transition',   // 6
  'Transition Metal',  // 7
  'Lanthanide',        // 8
  'Actinide',          // 9
  'Unknown'            // 10
];

// Vibrant Neon/Punchy Palette
const CATEGORY_COLORS: Record<number, { bg: string, text: string }> = {
  0: { bg: '#00ff7f', text: '#000' }, // Spring Green
  1: { bg: '#00ffff', text: '#000' }, // Cyan
  2: { bg: '#ff4b4b', text: '#fff' }, // Red
  3: { bg: '#ffd700', text: '#000' }, // Gold
  4: { bg: '#32cd32', text: '#000' }, // Lime Green
  5: { bg: '#20b2aa', text: '#fff' }, // Light Sea Green
  6: { bg: '#40e0d0', text: '#000' }, // Turquoise
  7: { bg: '#ff8c00', text: '#fff' }, // Dark Orange
  8: { bg: '#ff69b4', text: '#fff' }, // Hot Pink
  9: { bg: '#9370db', text: '#fff' }, // Medium Purple
  10: { bg: '#a9a9a9', text: '#000' }, // Grey
};

interface ElementData {
    number: number;
    symbol: string;
    name: string;
    weight: string;
    categoryIndex: number;
    melt: number | null;
    boil: number | null;
    row: number;
    col: number;
}

const PARSED_ELEMENTS: ElementData[] = RAW_DATA.map(d => ({
    number: d[0] as number,
    symbol: d[1] as string,
    name: d[2] as string,
    weight: d[3] as string,
    categoryIndex: d[4] as number,
    melt: d[5] as number | null,
    boil: d[6] as number | null,
    row: d[7] as number,
    col: d[8] as number
}));

export const PeriodicTable: React.FC = () => {
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [temperature, setTemperature] = useState(298); // Kelvin
  const [details, setDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showWikiModal, setShowWikiModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  // Auto-select Hydrogen on load
  useEffect(() => {
    handleSelectElement(PARSED_ELEMENTS[0]);
  }, []);

  const handleSelectElement = async (el: ElementData) => {
    setSelectedElement(el);
    setDetails(null);
    setLoadingDetails(true);
    try {
        const data = await GeminiService.getElementDeepDive(el.name);
        setDetails(data);
    } catch(e) {
        console.error(e);
    } finally {
        setLoadingDetails(false);
    }
  };

  const getState = (element: ElementData) => {
      if (element.melt === null) return 'unknown';
      if (temperature < element.melt) return 'Solid';
      if (element.boil !== null && temperature >= element.boil) return 'Gas';
      return 'Liquid';
  };

  const formattedTemp = useMemo(() => {
      const c = temperature - 273.15;
      const f = (c * 9/5) + 32;
      return { k: temperature, c: Math.round(c), f: Math.round(f) };
  }, [temperature]);

  const getImageUrl = (num: number) => 
    `https://periodictable.com/Samples/${String(num).padStart(3, '0')}/s13.JPG`;

  const getWikiUrl = (name: string) => `https://en.wikipedia.org/wiki/${name}`;

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#111] text-white relative overflow-hidden font-sans">
      
      {/* Sidebar Info Panel */}
      <div className="w-full md:w-80 lg:w-96 h-full bg-[#161616] border-r border-gray-800 flex flex-col overflow-y-auto shrink-0 z-20 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
         {selectedElement ? (
             <div className="p-0 flex flex-col h-full">
                 {/* Top Header with Element Block Look */}
                 <div className="p-6 bg-[#1a1a1a] border-b border-gray-800">
                     <div className="flex gap-6 items-start">
                         <div 
                             className="w-24 h-24 flex flex-col items-center justify-between p-2 rounded-lg text-3xl font-black shadow-lg border-2 border-white/10"
                             style={{ 
                                 backgroundColor: CATEGORY_COLORS[selectedElement.categoryIndex].bg,
                                 color: CATEGORY_COLORS[selectedElement.categoryIndex].text 
                             }}
                         >
                             <span className="text-xs self-start opacity-70">{selectedElement.number}</span>
                             <span className="text-4xl">{selectedElement.symbol}</span>
                             <span className="text-[10px] self-end opacity-70">{parseFloat(selectedElement.weight).toFixed(2)}</span>
                         </div>
                         <div className="flex-1">
                            <h2 className="text-3xl font-bold tracking-tight text-white mb-1">{selectedElement.name}</h2>
                            <p 
                                className="text-sm font-bold uppercase tracking-wider"
                                style={{ color: CATEGORY_COLORS[selectedElement.categoryIndex].bg }}
                            >
                                {CATEGORIES[selectedElement.categoryIndex]}
                            </p>
                            <div className="flex gap-2 mt-3">
                                <span className={`text-xs px-2 py-1 rounded bg-gray-800 ${getState(selectedElement) === 'Gas' ? 'text-red-400' : getState(selectedElement) === 'Liquid' ? 'text-blue-400' : 'text-gray-300'}`}>
                                    {getState(selectedElement)}
                                </span>
                                {details?.atomicProperties?.block && (
                                    <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300 uppercase">
                                        {details.atomicProperties.block}-block
                                    </span>
                                )}
                            </div>
                         </div>
                     </div>
                 </div>

                 {/* Big Photo Area */}
                 <div className="relative w-full aspect-video bg-black group cursor-pointer border-b border-gray-800 overflow-hidden" onClick={() => setShowWikiModal(true)}>
                     <img 
                       src={getImageUrl(selectedElement.number)} 
                       alt={selectedElement.name}
                       className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                     
                     <div className="absolute bottom-4 left-4 right-4">
                         <p className="text-xs font-bold uppercase tracking-widest mb-1 text-gray-400">Appearance</p>
                         <p className="text-sm font-medium text-gray-100 leading-snug">
                             {details?.appearance || 'Loading appearance...'}
                         </p>
                     </div>

                     <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
                        <Maximize2 size={16} />
                     </div>
                 </div>

                 {/* Write-up */}
                 <div className="p-6 border-b border-gray-800 bg-[#161616]">
                     <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">About {selectedElement.name}</h3>
                        <button onClick={() => setShowWikiModal(true)} className="text-blue-400 text-xs hover:text-blue-300 flex items-center gap-1 font-bold">
                            Wikipedia <ChevronRight size={12}/>
                        </button>
                     </div>
                     <div className="text-sm text-gray-300 leading-relaxed font-light">
                        {loadingDetails ? (
                            <div className="flex gap-2 items-center text-gray-500 py-4"><Loader2 className="animate-spin" size={16}/> Consulting Dr. Nova...</div>
                        ) : (
                            details?.description ? (
                                <>
                                    <p className="line-clamp-6 mb-2">{details.description}</p>
                                    <p className="text-xs text-gray-500 italic">"{details.funFact}"</p>
                                </>
                            ) : "No description available."
                        )}
                     </div>
                 </div>

                 {/* Properties List */}
                 <div className="flex-1 p-6 space-y-4 bg-[#161616]">
                     <div className="flex justify-between text-sm border-b border-gray-800 pb-2">
                         <span className="text-gray-500">Atomic Weight</span>
                         <span className="font-mono text-gray-200">{selectedElement.weight}</span>
                     </div>
                     <div className="flex justify-between text-sm border-b border-gray-800 pb-2">
                         <span className="text-gray-500">Melting Point</span>
                         <span className="font-mono text-gray-200">{selectedElement.melt ? `${selectedElement.melt} K` : 'N/A'}</span>
                     </div>
                     <div className="flex justify-between text-sm border-b border-gray-800 pb-2">
                         <span className="text-gray-500">Boiling Point</span>
                         <span className="font-mono text-gray-200">{selectedElement.boil ? `${selectedElement.boil} K` : 'N/A'}</span>
                     </div>
                     
                     {details?.atomicProperties && (
                         <>
                            <div className="flex justify-between text-sm border-b border-gray-800 pb-2">
                                <span className="text-gray-500">Electron Config</span>
                                <span className="font-mono text-right text-gray-200">{details.atomicProperties.electronConfiguration || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm border-b border-gray-800 pb-2">
                                <span className="text-gray-500">Electronegativity</span>
                                <span className="font-mono text-right text-gray-200">{details.atomicProperties.electronegativity || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm border-b border-gray-800 pb-2">
                                <span className="text-gray-500">Oxidation States</span>
                                <span className="font-mono text-right text-gray-200">{details.atomicProperties.oxidationStates || 'N/A'}</span>
                            </div>
                         </>
                     )}
                 </div>
             </div>
         ) : (
             <div className="h-full flex items-center justify-center text-gray-500">Select an element</div>
         )}
      </div>

      {/* Main Table Area */}
      <div className="flex-1 flex flex-col relative bg-[#0a0a0a]">
         {/* Top Bar */}
         <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-[#111]">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-200 tracking-tight hidden sm:block">Periodic Table</h2>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-800 rounded text-xs font-bold text-gray-300">
                        <div className="w-2 h-2 rounded-full bg-white"></div> Solid
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-800 rounded text-xs font-bold text-blue-400">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div> Liquid
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-800 rounded text-xs font-bold text-red-400">
                        <div className="w-2 h-2 rounded-full bg-red-400"></div> Gas
                    </div>
                </div>
            </div>
            
            {/* Temp Slider */}
            <div className="flex items-center gap-4 bg-[#1a1a1a] px-4 py-2 rounded-full border border-gray-800">
                <Thermometer size={16} className="text-gray-400" />
                <input 
                    type="range" 
                    min="0" 
                    max="6000" 
                    value={temperature} 
                    onChange={(e) => setTemperature(parseInt(e.target.value))}
                    className="w-24 md:w-48 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <div className="text-xs font-mono w-20 text-right text-gray-300">
                    {formattedTemp.c}°C
                </div>
            </div>
         </div>

         {/* Grid Container */}
         <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col items-center">
            
            <div className="relative">
                {/* Legend Overlay Grid (Row 1-3, Col 3-12 approx) */}
                <div className="absolute top-0 left-[11%] w-[50%] h-[160px] z-10 hidden lg:grid grid-cols-3 gap-2 pointer-events-none p-2">
                     {CATEGORIES.map((cat, idx) => (
                        <button
                            key={cat}
                            onMouseEnter={() => setActiveCategory(idx)}
                            onMouseLeave={() => setActiveCategory(null)}
                            className={`
                                pointer-events-auto
                                px-2 py-1 rounded text-[10px] uppercase font-bold border transition-all text-left flex items-center gap-2
                                ${activeCategory === idx ? 'scale-105 shadow-lg brightness-125' : 'opacity-80 hover:opacity-100'}
                            `}
                            style={{
                                backgroundColor: '#1a1a1a',
                                borderColor: CATEGORY_COLORS[idx].bg,
                                color: CATEGORY_COLORS[idx].bg
                            }}
                        >
                            <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[idx].bg }}></div>
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Actual Periodic Grid */}
                <div 
                    className="grid gap-1.5 select-none"
                    style={{ 
                        gridTemplateColumns: 'repeat(18, minmax(42px, 1fr))',
                        gridTemplateRows: 'repeat(10, minmax(56px, 1fr))',
                        width: '100%',
                        maxWidth: '1400px',
                        minWidth: '900px'
                    }}
                >
                    {PARSED_ELEMENTS.map((el) => {
                        const state = getState(el);
                        const isSelected = selectedElement?.number === el.number;
                        const isDimmed = activeCategory !== null && activeCategory !== el.categoryIndex;
                        const colorSet = CATEGORY_COLORS[el.categoryIndex];
                        const tempColor = state === 'Gas' ? '#ef4444' : state === 'Liquid' ? '#3b82f6' : '#ffffff';

                        return (
                            <button
                                key={el.number}
                                onClick={() => handleSelectElement(el)}
                                onMouseEnter={() => setActiveCategory(el.categoryIndex)}
                                onMouseLeave={() => setActiveCategory(null)}
                                className={`
                                    relative flex flex-col justify-between p-1.5 rounded-sm border transition-all duration-200 group
                                    ${isSelected ? 'z-20 scale-125 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'hover:z-10 hover:scale-110 hover:shadow-lg'}
                                    ${isDimmed ? 'opacity-20 grayscale blur-[1px]' : 'opacity-100'}
                                `}
                                style={{ 
                                    gridColumnStart: el.col, 
                                    gridRowStart: el.row,
                                    backgroundColor: '#1a1a1a',
                                    borderColor: isSelected ? '#fff' : 'transparent',
                                }}
                            >
                                {/* Category Color Bar */}
                                <div className="absolute top-0 left-0 bottom-0 w-1 opacity-80" style={{ backgroundColor: colorSet.bg }}></div>
                                
                                <div className="flex justify-between w-full pl-2">
                                    <span className="text-[9px] font-bold text-gray-500">{el.number}</span>
                                    <span 
                                        className="text-[10px] font-bold transition-colors"
                                        style={{ color: tempColor }}
                                    >
                                        {state === 'Gas' ? 'G' : state === 'Liquid' ? 'L' : ''}
                                    </span>
                                </div>
                                
                                <div className="flex flex-col items-center justify-center pl-1">
                                    <div 
                                        className="font-black text-lg md:text-xl leading-none mb-0.5"
                                        style={{ color: isSelected ? '#fff' : colorSet.bg }}
                                    >
                                        {el.symbol}
                                    </div>
                                    <div className="text-[9px] font-medium text-gray-400 truncate w-full text-center hidden md:block">
                                        {el.name}
                                    </div>
                                    <div className="text-[8px] font-mono text-gray-600 truncate w-full text-center hidden lg:block">
                                        {parseFloat(el.weight).toFixed(2)}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                    
                    {/* Placeholder Labels for Series */}
                    <div className="col-start-3 row-start-6 flex items-center justify-center text-gray-600 text-[10px] font-bold pointer-events-none border-2 border-dashed border-gray-800 rounded mx-1 pl-2">57-71</div>
                    <div className="col-start-3 row-start-7 flex items-center justify-center text-gray-600 text-[10px] font-bold pointer-events-none border-2 border-dashed border-gray-800 rounded mx-1 pl-2">89-103</div>
                </div>
            </div>
         </div>
      </div>

      {/* Wikipedia Popup Modal */}
      {showWikiModal && selectedElement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <div className="bg-[#121212] w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative border border-gray-800">
                  <div className="h-16 bg-[#181818] flex items-center justify-between px-6 border-b border-gray-800">
                      <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-md flex items-center justify-center text-black font-bold"
                            style={{ backgroundColor: CATEGORY_COLORS[selectedElement.categoryIndex].bg }}
                          >
                             {selectedElement.symbol}
                          </div>
                          <h3 className="font-bold text-white text-lg">{selectedElement.name}</h3>
                      </div>
                      <div className="flex gap-2">
                        <a 
                            href={getWikiUrl(selectedElement.name)} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-2.5 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors"
                            title="Open in new tab"
                        >
                            <ExternalLink size={20} />
                        </a>
                        <button onClick={() => setShowWikiModal(false)} className="p-2.5 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                      </div>
                  </div>
                  
                  <div className="flex-1 bg-white relative">
                       <iframe 
                         src={`https://en.m.wikipedia.org/wiki/${selectedElement.name}`}
                         className="w-full h-full"
                         title="Wikipedia"
                         sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                       />
                       {/* Overlay fallback if iframe blocked */}
                       <div className="absolute inset-0 pointer-events-none hidden md:block opacity-0"></div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
