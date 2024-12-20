import { NextResponse } from 'next/server';
import pLimit from 'p-limit';

export async function GET(req) {
  const planetCommands = [
    { name: 'Mercury', command: '199', center: '10' },
    { name: 'Venus', command: '299', center: '10' },
    { name: 'Earth', command: '399', center: '10' },
    { name: 'Mars', command: '499', center: '10' },
    { name: 'Jupiter', command: '599', center: '10' },
    { name: 'Saturn', command: '699', center: '10' },
    { name: 'Uranus', command: '799', center: '10' },
    { name: 'Neptune', command: '899', center: '10' },
    { name: 'Moon', command: '301', center: '399' }, // Moon orbits Earth
    { name: 'Deimos', command: '401', center: '499' }, // Deimos orbits Mars
    { name: 'Phobos', command: '402', center: '499' }, // Phobos orbits Mars
    { name: 'Io', command: '501', center: '599' }, // Io orbits Jupiter
    { name: 'Europa', command: '502', center: '599' }, // Europa orbits Jupiter
    { name: 'Ganymede', command: '503', center: '599' }, // Ganymede orbits Jupiter
    { name: 'Callisto', command: '504', center: '599' }, // Callisto orbits Jupiter
    { name: 'Titan', command: '606', center: '699' }, // Titan orbits Saturn
    { name: 'Rhea', command: '605', center: '699' }, // Rhea orbits Saturn
    { name: 'Iapetus', command: '608', center: '699' }, // Iapetus orbits Saturn
    { name: 'Dione', command: '604', center: '699' }, // Dione orbits Saturn
    { name: 'Tethys', command: '603', center: '699' }, // Tethys orbits Saturn
    { name: 'Enceladus', command: '602', center: '699' }, // Enceladus orbits Saturn
    { name: 'Mimas', command: '601', center: '699' }, // Mimas orbits Saturn
    { name: 'Miranda', command: '715', center: '799' }, // Miranda orbits Uranus
    { name: 'Ariel', command: '716', center: '799' }, // Ariel orbits Uranus
    { name: 'Umbriel', command: '717', center: '799' }, // Umbriel orbits Uranus
    { name: 'Titania', command: '718', center: '799' }, // Titania orbits Uranus
    { name: 'Oberon', command: '719', center: '799' }, // Oberon orbits Uranus
    { name: 'Triton', command: '801', center: '899' }, // Triton orbits Neptune
    // { name: 'Proteus', command: '802', center: '899' }, // Proteus orbits Neptune
  ];

  function getCurrentTime() {
    const today = new Date();
    const yyyy = today.getUTCFullYear();
    const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(today.getUTCDate()).padStart(2, '0');
    const hh = String(today.getUTCHours()).padStart(2, '0');
    const min = String(today.getUTCMinutes()).padStart(2, '0');
    const ss = String(today.getUTCSeconds()).padStart(2, '0');
    const dateString = `${yyyy}-${mm}-${dd}`;
    const timeString = `${dateString} ${hh}:${min}:${ss}`;
    return timeString;
  }

  let startTime = getCurrentTime();
  let stopTimeDate = new Date(new Date().getTime() + 60 * 60 * 1000); // Add one hour
  let stopHh = String(stopTimeDate.getUTCHours()).padStart(2, '0');
  let stopMin = String(stopTimeDate.getUTCMinutes()).padStart(2, '0');
  let stopSs = String(stopTimeDate.getUTCSeconds()).padStart(2, '0');
  let stopTime = `${startTime.split(' ')[0]} ${stopHh}:${stopMin}:${stopSs}`;

  function updateTimes() {
    startTime = getCurrentTime();
    stopTimeDate = new Date(new Date().getTime() + 60 * 60 * 1000); // Add one hour
    stopHh = String(stopTimeDate.getUTCHours()).padStart(2, '0');
    stopMin = String(stopTimeDate.getUTCMinutes()).padStart(2, '0');
    stopSs = String(stopTimeDate.getUTCSeconds()).padStart(2, '0');
    stopTime = `${startTime.split(' ')[0]} ${stopHh}:${stopMin}:${stopSs}`;

    console.log('Start Time: ', startTime);
    console.log('Stop Time: ', stopTime);
  }

  // Update the time every 10 seconds
  setInterval(updateTimes, 10000);

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  try {
    const limit = pLimit(2);

    const fetchPromises = planetCommands.map(({ name, command, center }, index) => {
      return limit(async () => {
        // we add delay between requests
        await delay(index * 100);

        const params = {
          format: 'text',
          COMMAND: `'${command}'`,
          OUT_UNITS: "'AU-D'",
          OBJ_DATA: "'NO'",
          MAKE_EPHEM: "'YES'",
          EPHEM_TYPE: "'VECTORS'",
          CENTER: `'500@${center}'`,
          START_TIME: `'${startTime}'`,
          STOP_TIME: `'${stopTime}'`,
          STEP_SIZE: "'1d'",
        };

        const queryString = Object.keys(params)
          .map((key) => `${key}=${encodeURIComponent(params[key])}`)
          .join('&');

        const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${queryString}`;

        const apiRes = await fetch(url);

        if (!apiRes.ok) {
          const errorDetails = await apiRes.text();
          console.error(`Horizons API returned status ${apiRes.status} for ${name}:`, errorDetails);
          return { planetName, error: errorDetails };
        }

        const rawData = await apiRes.text();

        // Parse the response to extract data
        const resultLines = rawData.split('\n');
        const startIndex = resultLines.indexOf('$$SOE');
        const endIndex = resultLines.indexOf('$$EOE');

        if (startIndex === -1 || endIndex === -1) {
          const errorMessage = 'No data found between $$SOE and $$EOE markers.';
          console.error(`Error for ${name}: ${errorMessage}\n`, rawData);
          return { name, error: errorMessage };
        }

        // Extract and format the data lines
        const dataLines = resultLines.slice(startIndex + 1, endIndex);

        const parsedData = [];
        let i = 0;

        while (i < dataLines.length) {
          const line1 = dataLines[i].trim();
          const line2 = dataLines[i + 1]?.trim();
          const line3 = dataLines[i + 2]?.trim();

          const jdMatch = line1.match(/^(\d+\.\d+)\s+=\s+(.+)/);
          if (jdMatch) {
            const time = jdMatch[1];
            const datetime = jdMatch[2];

            const xyzMatch = line2.match(/X\s*=\s*([\dE+-.]+)\s+Y\s*=\s*([\dE+-.]+)\s+Z\s*=\s*([\dE+-.]+)/);
            const vxvyvzMatch = line3.match(/VX\s*=\s*([\dE+-.]+)\s+VY\s*=\s*([\dE+-.]+)\s+VZ\s*=\s*([\dE+-.]+)/);

            if (xyzMatch && vxvyvzMatch) {
              const x = parseFloat(xyzMatch[1]);
              const y = parseFloat(xyzMatch[2]);
              const z = parseFloat(xyzMatch[3]);

              const vx = parseFloat(vxvyvzMatch[1]);
              const vy = parseFloat(vxvyvzMatch[2]);
              const vz = parseFloat(vxvyvzMatch[3]);

              parsedData.push({ time, datetime, x, y, z, vx, vy, vz });
            }

            i += 4;
          } else {
            i++;
          }
        }

        return { name, data: parsedData };
      });
    });

    const results = await Promise.all(fetchPromises);

    const dataByPlanet = {};
    const errors = [];

    results.forEach((result) => {
      if (result.error) {
        errors.push({ planet: result.name, error: result.error });
      } else {
        dataByPlanet[result.name] = result.data;
      }
    });

    const responseData = {
      data: dataByPlanet,
      ...(errors.length > 0 && { errors }),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching data from Horizons API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ID#      Name                               Designation  IAU/aliases/other   
  -------  ---------------------------------- -----------  ------------------- 
        0  Solar System Barycenter                         SSB                  
        1  Mercury Barycenter                                                   
        2  Venus Barycenter                                                     
        3  Earth-Moon Barycenter                           EMB                  
        4  Mars Barycenter                                                      
        5  Jupiter Barycenter                                                   
        6  Saturn Barycenter                                                    
        7  Uranus Barycenter                                                    
        8  Neptune Barycenter                                                   
        9  Pluto Barycenter                                                     
       10  Sun                                             Sol                  
       31  SEMB-L1                                         Lagrange             
       32  SEMB-L2                                         Lagrange             
       34  SEMB-L4                                         Lagrange             
       35  SEMB-L5                                         Lagrange             
      199  Mercury                                                              
      299  Venus                                                                
      301  Moon                                            Luna                 
      399  Earth                                           Geocenter            
      401  Phobos                                          MI                   
      402  Deimos                                          MII                  
      499  Mars                                                                 
      501  Io                                              JI                   
      502  Europa                                          JII                  
      503  Ganymede                                        JIII                 
      504  Callisto                                        JIV                  
      505  Amalthea                                        JV                   
      506  Himalia                                         JVI                  
      507  Elara                                           JVII                 
      508  Pasiphae                                        JVIII                
      509  Sinope                                          JIX                  
      510  Lysithea                                        JX                   
      511  Carme                                           JXI                  
      512  Ananke                                          JXII                 
      513  Leda                                            JXIII                
      514  Thebe                                           JXIV                 
      515  Adrastea                                        JXV                  
      516  Metis                                           JXVI                 
      517  Callirrhoe                         1999J1       JXVII                
      518  Themisto                           1975J1       JXVIII 2000J1        
      519  Megaclite                          2000J8       JXIX                 
      520  Taygete                            2000J9       JXX                  
      521  Chaldene                           2000J10      JXXI                 
      522  Harpalyke                          2000J5       JXXII                
      523  Kalyke                             2000J2       JXXIII               
      524  Iocaste                            2000J3       JXXIV                
      525  Erinome                            2000J4       JXXV                 
      526  Isonoe                             2000J6       JXXVI                
      527  Praxidike                          2000J7       JXXVII               
      528  Autonoe                            2001J1       JXXVIII              
      529  Thyone                             2001J2       JXXIX                
      530  Hermippe                           2001J3       JXXX                 
      531  Aitne                              2001J11      JXXXI                
      532  Eurydome                           2001J4       JXXXII               
      533  Euanthe                            2001J7       JXXXIII              
      534  Euporie                            2001J10      JXXXIV               
      535  Orthosie                           2001J9       JXXXV                
      536  Sponde                             2001J5       JXXXVI               
      537  Kale                               2001J8       JXXXVII              
      538  Pasithee                           2001J6       JXXXVIII             
      539  Hegemone                           2003J8       JXXXIX               
      540  Mneme                              2003J21      JXL                  
      541  Aoede                              2003J7       JXLI                 
      542  Thelxinoe                          2003J22      JXLII                
      543  Arche                              2002J1       JXLIII               
      544  Kallichore                         2003J11      JXLIV                
      545  Helike                             2003J6       JXLV                 
      546  Carpo                              2003J20      JXLVI                
      547  Eukelade                           2003J1       JXLVII               
      548  Cyllene                            2003J13      JXLVIII              
      549  Kore                               2003J14      JXLIX                
      550  Herse                              2003J17      JXLXII               
      551                                     2010J1       JLI                  
      552                                     2010J2       JLII                 
      553  Dia                                2000J11      JLIII                
      554                                     2016J1       JLIV                 
      555                                     2003J18      JLV 55069            
      556                                     2011J2       JLVI 55075           
      557  Eirene                             2003J5       JLVII 55063          
      558  Philophrosyne                      2003J15      JLVIII 55067         
      559                                     2017J1       JLIX                 
      560  Eupheme                            2003J3       JLX 55061            
      561                                     2003J19      55070                
      562  Valetudo                           2016J2       55078                
      563                                     2017J2       55079                
      564                                     2017J3       55080                
      565  Pandia                             2017J4       JLXV 55081           
      566                                     2017J5       55082                
      567                                     2017J6       55083                
      568                                     2017J7       55084                
      569                                     2017J8       55085                
      570                                     2017J9       JLXX 55086           
      571  Ersa                               2018J1       55087                
      572                                     2011J1       55074                
    55501                                     2003J2       55060                
    55502                                     2003J4       55062                
    55503                                     2003J9       55064                
    55504                                     2003J10      55065                
    55505                                     2003J12      55066                
    55506                                     2003J16      55068                
    55507                                     2003J23      55071                
    55508                                     2003J24                           
    55509                                     2011J3                            
    55510                                     2018J2                            
    55511                                     2018J3                            
    55512                                     2021J1                            
    55513                                     2021J2                            
    55514                                     2021J3                            
    55515                                     2021J4                            
    55516                                     2021J5                            
    55517                                     2021J6                            
    55518                                     2016J3                            
    55519                                     2016J4                            
    55520                                     2018J4                            
    55521                                     2022J1                            
    55522                                     2022J2                            
    55523                                     2022J3                            
      599  Jupiter                                                              
      601  Mimas                                           SI                   
      602  Enceladus                                       SII                  
      603  Tethys                                          SIII                 
      604  Dione                                           SIV                  
      605  Rhea                                            SV                   
      606  Titan                                           SVI                  
      607  Hyperion                                        SVII                 
      608  Iapetus                                         SVIII                
      609  Phoebe                                          SIX                  
      610  Janus                                           SX                   
      611  Epimetheus                                      SXI                  
      612  Helene                                          SXII                 
      613  Telesto                                         SXIII                
      614  Calypso                                         SXIV                 
      615  Atlas                                           SXV                  
      616  Prometheus                                      SXVI                 
      617  Pandora                                         SXVII                
      618  Pan                                             SXVIII               
      619  Ymir                               2000S1       SXIX                 
      620  Paaliaq                            2000S2       SXX                  
      621  Tarvos                             2000S4       SXXI                 
      622  Ijiraq                             2000S6       SXXII                
      623  Suttungr                           2000S12      SXXIII               
      624  Kiviuq                             2000S5       SXXIV                
      625  Mundilfari                         2000S9       SXXV                 
      626  Albiorix                           2000S11      SXXVI                
      627  Skathi                             2000S8       SXXVII               
      628  Erriapus                           2000S10      SXXVIII              
      629  Siarnaq                            2000S3       SXXIX                
      630  Thrymr                             2000S7       SXXX                 
      631  Narvi                              2003S1       SXXXI                
      632  Methone                            2004S1       SXXXII               
      633  Pallene                            2004S2       SXXXIII              
      634  Polydeuces                         2004S5       SXXXIV               
      635  Daphnis                            2005S1       SXXXV                
      636  Aegir                              2004S10      SXXXVI 65038         
      637  Bebhionn                           2004S11      SXXXVII 65039        
      638  Bergelmir                          2004S15      SXXXVIII 65043       
      639  Bestla                             2004S18      SXXXIX 65046         
      640  Farbauti                           2004S9       SXL 65037            
      641  Fenrir                             2004S16      SXLI 65044           
      642  Fornjot                            2004S8       SXLII 65036          
      643  Hati                               2004S14      SXLIII               
      644  Hyrrokkin                          2004S19      SXLIV                
      645  Kari                               2006S2       SXLV                 
      646  Loge                               2006S5       SXLVI                
      647  Skoll                              2006S8       SXLVII               
      648  Surtur                             2006S7       SXLVIII              
      649  Anthe                              2007S4       SXLIX                
      650  Jarnsaxa                           2006S6       SL                   
      651  Greip                              2006S4       SLI                  
      652  Tarqeq                             2007S1       SLII                 
      653  Aegaeon                            2008S1       SLIII                
      654  Gridr                              2004S20      65080                
      655  Angrboda                           2004S22      65073                
      656  Skrymir                            2004S23      65071                
      657  Gerd                               2004S25      65072                
      658                                     2004S26      65068                
      659  Eggther                            2004S27                           
      660                                     2004S29      65066                
      661  Beli                               2004S30      65078                
      662  Gunnlod                            2004S32      65074                
      663  Thiazzi                            2004S33      65075                
      664                                     2004S34      65076                
      665  Alvaldi                            2004S35      65069                
      666  Geirrod                            2004S38      65083                
    65067                                     2004S31                           
    65070                                     2004S24                           
    65077                                     2004S28                           
    65079                                     2004S21                           
    65081                                     2004S36                           
    65082                                     2004S37                           
    65084                                     2004S39                           
    65085                                     2004S7       65035                
    65086                                     2004S12      65040                
    65087                                     2004S13      65041                
    65088                                     2004S17      65045                
    65089                                     2006S1                            
    65090                                     2006S3       65050                
    65091                                     2007S2                            
    65092                                     2007S3                            
    65093                                     2019S1                            
    65094                                     2019S2                            
    65095                                     2019S3                            
    65096                                     2020S1                            
    65097                                     2020S2                            
    65098                                     2004S40                           
    65100                                     2006S9                            
    65101                                     2007S5                            
    65102                                     2020S3                            
    65103                                     2019S4                            
    65104                                     2004S41                           
    65105                                     2020S4                            
    65106                                     2020S5                            
    65107                                     2007S6                            
    65108                                     2004S42                           
    65109                                     2006S10                           
    65110                                     2019S5                            
    65111                                     2004S43                           
    65112                                     2004S44                           
    65113                                     2004S45                           
    65114                                     2006S11                           
    65115                                     2006S12                           
    65116                                     2019S6                            
    65117                                     2006S13                           
    65118                                     2019S7                            
    65119                                     2019S8                            
    65120                                     2019S9                            
    65121                                     2004S46                           
    65122                                     2019S10                           
    65123                                     2004S47                           
    65124                                     2019S11                           
    65125                                     2006S14                           
    65126                                     2019S12                           
    65127                                     2020S6                            
    65128                                     2019S13                           
    65129                                     2005S4                            
    65130                                     2007S7                            
    65131                                     2007S8                            
    65132                                     2020S7                            
    65133                                     2019S14                           
    65134                                     2019S15                           
    65135                                     2005S5                            
    65136                                     2006S15                           
    65137                                     2006S16                           
    65138                                     2006S17                           
    65139                                     2004S48                           
    65140                                     2020S8                            
    65141                                     2004S49                           
    65142                                     2004S50                           
    65143                                     2006S18                           
    65144                                     2019S16                           
    65145                                     2019S17                           
    65146                                     2019S18                           
    65147                                     2019S19                           
    65148                                     2019S20                           
    65149                                     2006S19                           
    65150                                     2004S51                           
    65151                                     2020S9                            
    65152                                     2004S52                           
    65153                                     2007S9                            
    65154                                     2004S53                           
    65155                                     2020S10                           
    65156                                     2019S21                           
    65157                                     2006S20                           
      699  Saturn                                                               
      701  Ariel                                           UI                   
      702  Umbriel                                         UII                  
      703  Titania                                         UIII                 
      704  Oberon                                          UIV                  
      705  Miranda                                         UV                   
      706  Cordelia                                        UVI                  
      707  Ophelia                                         UVII                 
      708  Bianca                                          UVIII                
      709  Cressida                                        UIX                  
      710  Desdemona                                       UX                   
      711  Juliet                                          UXI                  
      712  Portia                                          UXII                 
      713  Rosalind                                        UXIII                
      714  Belinda                                         UXIV                 
      715  Puck                                            UXV                  
      716  Caliban                                         UXVI                 
      717  Sycorax                                         UXVII                
      718  Prospero                           1999U3       UXVIII               
      719  Setebos                            1999U1       UXIX                 
      720  Stephano                           1999U2       UXX                  
      721  Trinculo                           2001U1       UXXI                 
      722  Francisco                          2001U3       UXXII                
      723  Margaret                           2003U3       UXXIII               
      724  Ferdinand                          2001U2       UXXIV                
      725  Perdita                            1986U10      UXXV                 
      726  Mab                                2003U1       UXXVI                
      727  Cupid                              2003U2       UXXVII               
      799  Uranus                                                               
    75051  2023U1                                                               
      801  Triton                                          NI                   
      802  Nereid                                          NII                  
      803  Naiad                                           NIII                 
      804  Thalassa                                        NIV                  
      805  Despina                                         NV                   
      806  Galatea                                         NVI                  
      807  Larissa                                         NVII                 
      808  Proteus                                         NVIII                
      809  Halimede                           2002N1                            
      810  Psamathe                           2003N1                            
      811  Sao                                2002N2                            
      812  Laomedeia                          2002N                             
      813  Neso                               2002N4                            
      814  Hippocamp                          2004N1                            
      899  Neptune                                                              
    85051  2002N5                                                               
    85052  2021N1                                                               
      901  Charon                                          PI                   
      902  Nix                                             PII                  
      903  Hydra                                           PIII                 
      904  Kerberos                           2011P1                            
      905  Styx                               2012P1                            
      999  Pluto                              134340                            
     3011  EM-L1                                           Lagrange             
     3012  EM-L2                                           Lagrange             
     3014  EM-L4                                           Lagrange             
     3015  EM-L5                                           Lagrange             
       -2  Mariner 2 (spacecraft)                                               
       -3  Mars Orbiter Mission (MOM) (spacecr             Mangalyaan           
       -5  Planet-C (spacecraft)                           VCO Akatsuki         
       -6  Pioneer 6 (spacecraft)                                               
       -8  Wind (spacecraft)                                                    
      -12  LADEE (spacecraft)                                                   
      -18  LCROSS Shepherd (spacecraft)                    SSC                  
   -18900  LCROSS Centaur Impactor (spacecraft                                  
      -20  Pioneer 8 (spacecraft)                                               
      -21  SOHO (spacecraft)                                                    
      -23  Pioneer 10 (spacecraft)                                              
      -24  Pioneer 11 (spacecraft)                                              
      -25  Lunar Prospector (LP) (spacecraft)                                   
      -28  JUICE (spacecraft)                                                   
      -29  Stardust (bus) (spacecraft)                     NExT                 
   -29900  Stardust (SRC) (spacecraft)                                          
      -30  Deep Space 1 (spacecraft)                       DS1 DS-1             
      -31  Voyager 1 (spacecraft)                                               
      -32  Voyager 2 (spacecraft)                                               
      -33  NEOS (spacecraft)                  NEO Surveyor                      
      -37  Hayabusa 2 (spacecraft)                                              
      -39  Ouna (spacecraft)                                                    
      -40  Clementine (spacecraft)                         DSPSE                
      -41  Mars Express (spacecraft)                       MEX                  
      -47  Genesis (bus) (spacecraft)                                           
      -48  Hubble Space Telescope                          HST (spacecraft)     
      -49  Lucy (spacecraft)                                                    
   -47900  Genesis (SRC) (spacecraft)                                           
      -53  Mars Odyssey (spacecraft)                                            
     -530  Mars Pathfinder (spacecraft)                    MPF                  
      -55  Ulysses (spacecraft)                                                 
      -61  Juno (spacecraft)                                                    
      -62  EMM (spacecraft)                                Hope Emirates        
      -64  OSIRIS-REx (spacecraft)                         OSIRIS-APEX ORX      
      -65  MarCO-A (spacecraft)                            Wall-E               
      -66  MarCO-B (spacecraft)                            Eva                  
      -70  Deep Impact IMPACTOR (spacecraft)                                    
      -74  Mars Reconnaissance Orbiter (spacec             MRO                  
      -75  OMOTENASHI (spacecraft)                                              
      -76  Mars Science Laboratory (spacecraft             Curiosity MSL        
   -74900  MRO Centaur Stage (spacecraft)                                       
      -77  Galileo (spacecraft)                                                 
      -78  DSCOVR (spacecraft)                             Triana               
      -79  Spitzer Space Telescope                         SST SIRTF (spacecraf 
      -82  Cassini (spacecraft)                                                 
      -84  Phoenix (spacecraft)                                                 
      -85  LRO (spacecraft)                                                     
      -86  Chandrayaan-1 (spacecraft)                      CH1 CH-1             
      -91  HERA (spacecraft)                                                    
      -92  ACE (spacecraft)                                Advanced Composition 
      -93  NEAR (spacecraft)                                                    
      -95  TESS (spacecraft)                                                    
      -96  Parker Solar Probe (spacecraft)                 SPP PSP              
      -98  New Horizons (spacecraft)                       NH New_Horizons      
     -101  EQUULEUS (spacecraft)                                                
     -111  ICE (spacecraft)                                ISEE-3               
     -121  BepiColombo (Spacecraft)                        MPO MMO              
     -125  ICPS (Spacecraft)                               2022-156B            
     -130  Hayabusa (spacecraft)                           Muses-C              
     -135  DART (spacecraft)                                                    
     -140  Deep Impact Flyby - EPOXI (spacecra             EPOXI                
     -143  ExoMars16 TGO (spacecraft)                                           
     -144  Solar Orbiter (spacecraft)                      Solo                 
     -150  Cassini Huygens (spacecraft)                                         
     -151  Chandra Observatory (spacecraft)                                     
     -152  Chandrayaan-2 (ORBITER) (spacecraft             CH2 CH-2             
     -153  Chandrayaan-2 (LANDER) (spacecraft)             CH2 CH-2             
     -155  Danuri (spacecraft)                KPLO                              
     -156  Aditya-L1                                                            
     -158  Chandrayaan-3 (LANDER spacecraft)               CH-3 CH3 Vikram      
     -163  WISE (spacecraft)                                                    
     -164  Lunar Flashlight (spacecraft)                   LFL                  
     -165  WMAP (spacecraft)                                                    
     -168  Mars2020 (spacecraft)                           Perserverance Ingenu 
     -169  Chandrayaan-3P (ORBITER) (spacecraf             CH-3P CH3P           
     -170  James Webb Space Telescope (spacecr             JWST                 
     -176  GRAIL-SS Second Stage (spacecraft)                                   
     -177  GRAIL-A (spacecraft)                            Ebb                  
     -178  Nozomi (spacecraft)                             Planet-B             
     -181  GRAIL-B (spacecraft)                            Flow                 
     -182  NEA Scout (spacecraft)                                               
     -189  InSight (spacecraft)                                                 
     -192  THEMIS-B (spacecraft)                           ARTEMIS-P1           
     -193  THEMIS-C (spacecraft)                           ARTEMIS-P2           
     -198  INTEGRAL (spacecraft)                                                
     -202  MAVEN (spacecraft)                                                   
     -203  Dawn (spacecraft)                                                    
     -204  CONTOUR-A (SPACECRAFT FRAGMENT)                                      
     -205  CONTOUR-B (SPACECRAFT FRAGMENT)                                      
     -206  CONTOUR-C (SPACECRAFT FRAGMENT)                                      
     -210  LICIACube (spacecraft)                                               
     -226  Rosetta (spacecraft)                                                 
     -227  Kepler (spacecraft)                                                  
     -229  IM-1 (spacecraft)                  Odysseus     Nova-C               
     -234  STEREO-A (spacecraft)                           AHEAD                
     -235  STEREO-B (spacecraft)                           BEHIND               
  -234900  STEREO Third Stage (spacecraft)                                      
     -236  MESSENGER (spacecraft)                                               
     -240  SLIM (spacecraft)                                                    
     -244  Peregrine (spacecraft)                          APM1                 
     -248  Venus Express (spacecraft)                      VEX                  
     -253  Opportunity (spacecraft)                        MER-B MER-1          
     -254  Spirit (spacecraft)                             MER-A MER-2          
     -255  Psyche (spacecraft)                                                  
     -344  Galileo Probe (spacecraft)                                           
     -486  Herschel Space Observatory (spacecr                                  
     -489  Planck Space Observatory (spacecraf                                  
     -490  Lucy Centaur RB Booster (spacecraft             2021-093B            
     -557  Spektr-R Observatory (spacecraft)                                    
     -610  Juno Centaur Stage (spacecraft)                                      
     -640  Infrared Space Observatory (spacecr             ISO                  
     -680  Euclid (spacecraft)                                                  
     -760  MSL Centaur Stage (spacecraft)                                       
     -997  NEOCP 6Q0B44E                                   B44E                 
     -998  NEOCP J002E3                                                         
    -1023  Artemis I (spacecraft)                          Orion EM-1           
    -1176  CAPSTONE (spacecraft)                                                
   -40000  Clementine Extended (spacecraft)                                     
   -64090  Osiris-REx SRC (spacecraft)                                          
   -78000  Chang'e_5-T1_booster (spacecraft)  WE0913A      2014-065B            
   -23230  ETS-6 (spacecraft)                              Kiku-6               
  -399050  2015 PDC (simulation)                                                
  -399080  Apollo 8 S-IVB (spacecraft)                                          
  -399090  Apollo 9 S-IVB (spacecraft)                                          
  -399100  Apollo 10 S-IVB (spacecraft)                                         
  -399101  Apollo 10 LM (spacecraft)                       Snoopy               
  -399110  Apollo 11 S-IVB (spacecraft)                                         
  -399120  Apollo 12 S-IVB (spacecraft)                                         
  -100836  Vela-2A (spacecraft)                            1964-040A            
  -101361  LCS-1 (spacecraft)                              1965-034C            
  -102770  Titan-3C RB (spacecraft)                        1967-040F            
  -106197  IMP-7 (spacecraft)                              1972-073A            
  -107964  Atlas-Agena_RB (spacecraft)                     1975-055B            
  -108366  GOES-1 (spacecraft)                             1975-100A            
  -108820  LAGEOS-1 (spacecraft)                           1976-039A            
  -111353  FLTSATCOM 2 (spacecraft)                        1979-038A            
  -112065  SBS-1 (spacecraft)                              1980-091A            
  -112472  GOES-5 (spacecraft)                             1981-049A            
  -113269  WESTAR-5 (spacecraft)                           1982-058A            
  -113631  SATCOM-C5 (spacecraft)                          1982-105A RCA-SATCOM 
  -113901  ASTRON (spacecraft)                             1983-020A            
  -114050  GOES-6 (spacecraft)                             1983-041A            
  -115993  AUSSAT-1 (spacecraft)                           1985-076B OPTUS-A1   
  -116275  AUSSAT-2 (spacecraft)                           1985-109C OPTUS-A2   
  -116292  1985-110B (spacecraft)             SL-8_RB                           
  -116609  Mir (spacecraft)                   1986-07A                          
  -116908  AJISAI (spacecraft)                             1986-061A            
  -119548  TDRS-3 (spacecraft)                             1988-091B            
  -119751  Etalon-1 (spacecraft)                           1989-001C            
  -120026  Etalon-2 (spacecraft)                           1989-039C            
  -120452  NAVSTAR-18 (spacecraft)                         1990-008A            
  -122087  AUSSAT-B1 (spacecraft)                          1992-054A OPTUS-B1   
  -122195  LAGEOS-2 (spacecraft)                           1992-070B            
  -122911  Solidaridad-1 (spacecraft)                      1993-073A            
  -122927  Telstar-401 (spacecraft)                        1993-077A            
  -123051  GOES-8 (spacecraft)                             1994-022A            
  -123227  AUSSAT-B3 (spacecraft)                          1994-055A OPTUS-B3   
  -123553  AMSC-1 (spacecraft)                             1995-019A            
  -123581  GOES-9 (spacecraft)                             1995-025A            
  -123754  Echostar-1 (spacecraft)                         1995-073A            
  -123846  MSAT-1 (spacecraft)                             1996-022A            
  -124313  Echostar-2 (spacecraft)                         1996-055A            
  -124720  HALCA (spacecraft)                 Muses-B      1997-005A Haruka VSO 
  -124786  GOES-10 (spacecraft)                            1997-019A            
  -125126  HGS-1 (spacecraft)                 Asiasat-3    1997-086A PAS-22     
  -125544  International Space Station (spacec             1998-067A ISS        
  -125789  QuikSCAT (spacecraft)                           1999-034A            
  -125989  XMM-Newton (spacecraft)                         1999-066A            
  -125994  TERRA (spacecraft)                              EOS-1 1999-068A      
  -126352  GOES-11 (spacecraft)                            2000-022A            
  -126402  Echostar-6 (spacecraft)                         2000-038A            
  -126407  NAVSTAR-48 (spacecraft)                         2000-040A            
  -126619  EO-1 (spacecraft)                               2000-075A            
  -126639  AMC-8 (spacecraft)                              GE-8 2000-081B       
  -126824  Intelsat-901 (spacecraft)                       2001-024A            
  -126871  GOES-12 (spacecraft)                            2001-031A            
  -127391  GRACE-1 (spacecraft)                            2002-012A            
  -127424  Aqua (spacecraft)                               2002-022A            
  -127509  Meteosat-8 (spacecraft)                         2002-040B            
  -127783  GALEX (spacecraft)                                                   
  -128376  Aura (spacecraft)                               2004-026A            
  -128378  Anik-F2 (spacecraft)                            2004-027A            
  -128485  Swift Observatory (spacecraft)                  2004-047A            
  -128868  Anik-F1R (spacecraft)                           2005-036A            
  -128884  Galaxy-15 (spacecraft)                          2005-041A            
  -128912  Meteosat-9 (spacecraft)                         2005-049B            
  -129107  Cloudsat (spacecraft)                           2006-016B            
  -129494  DirecTV-9S (spacecraft)                         2006-043A            
  -129520  XM-4 (spacecraft)                               2006-049A            
  -132487  Thor-5 (spacecraft)                             2008-006A Thor-2R    
  -132763  ICO_G-1 (spacecraft)               DBSD G1      2008-016A Echostar G 
  -133105  Jason-2 (spacecraft)                            2008-032A            
  -133207  Echostar-11 (spacecraft)                        2008-035A            
  -134381  Kepler Booster (Third Stage) (space                                  
  -135491  GOES-14 (spacecraft)                            2009-033A            
  -136032  NSS-12 (spacecraft)                             2009-058A            
  -136134                                                                       
  -136395  Solar Dynamics Observatory (spacecr             2010-005A SDO        
  -136499  Echostar-14 (spacecraft)                        2010-010A            
  -137218  SKYTERRA-1 (spacecraft)                         2010-061A            
  -137820  Tiangong-1 (spacecraft)                         2011-053A            
  -138250  BEIDOU-M3 (spacecraft)                          2012-018A            
  -138358  NuSTAR (spacecraft)                             2012-031A SMEX-11    
  -138551  Echostar-17 (spacecraft)                        2012-035A            
  -138552  Meteosat-10 (spacecraft)                        2012-035B            
  -138833  NAVSTAR-67 (spacecraft)                         2012-053A            
  -139089  NEOSsat (spacecraft)                            2013-009D            
  -139166  NAVSTAR-68 (spacecraft)                         2013-023A            
  -139459  Chang'e_3_booster (spacecraft)                  2013-070B            
  -139479  Gaia (spacecraft)                                                    
  -140059  OCO-2 (spacecraft)                              2014-035A            
  -140267  Himawari-8 (spacecraft)                         2014-060A            
  -140376  SMAP (spacecraft)                               2015-003A            
  -140482  MMS-1 (spacecraft)                              2015-011A            
  -140483  MMS-2 (spacecraft)                              2015-011B            
  -140484  MMS-3 (spacecraft)                              2015-011C            
  -140485  MMS-4 (spacecraft)                              2015-011D            
  -140663  DirecTV-15 (spacecraft)                         2015-026A            
  -140732  Meteosat-11 (spacecraft)                        2015-034A            
  -140947  2015-056B (spacecraft)                                               
  -141043  LISA Pathfinder (spacecraft)                    LPF                  
  -141240  Jason-3 (spacecraft)                            2016-002A            
  -141748  Intelsat-33E (spacecraft)                       2016-053A            
  -141836  Himawari-9 (spacecraft)                         2016-064A            
  -141866  GOES-16 (spacecraft)                            2016-071A            
  -143205  SpaceX Roadster (spacecraft)                    Tesla Starman        
  -143226  GOES-17 (spacecraft)                            2018-022A            
  -143241  GSAT-6A (spacecraft)                            2018-027A            
  -143846  Chang'e_4_booster (spacecraft)                  2018-103B            
  -151850  GOES-18 (spacecraft)                            2022-021A            
  -159588  ACS3 (spacecraft)                               2024-077B            
  -160133  GOES-19 (spacecraft)                            2024-119A            
  -999742  LISA Pathfinder Propulsion Module (             PRM                  
   999787  WT1190F                                                              
  -937001  2017 PDC (simulation)                           PDC17                
  -937002  2017 PDCa (simulation)                          PDC17a               
  -937011  2019 PDC (simulation)                           PDC19                
  -937012  c2019 PDC (simulation)                          cPDC19 PDC19-c       
  -937014  2021 PDC (simulation)                           PDC21                
  -937015  2021 PDCa (simulation)                          PDC21a               
  -937016  2023 PDC (simulation)                           PDC23                
  -937017  2023 PDCa (simulation)                          PDC23a               
  -937018  2023 PDCf (simulation)                          PDC23f               
  -937019  2024 PDC25 (simulation)                         PDC25 PDC24          
  -937021  TTX19 (simulation)                                                   
  -937022  TTX19a (simulation)                                                  
  -937023  2022 TTX (simulation)              TTX22                             
  -937024  2023 TTX (simulation)              TTX23 TTX24 T2024 TTX             
  -999789  2023 NM (debris)                                                     
  1000012                                                                       
  1000041  Hartley 2                          103P                              
  1000093                                                                       
  1000107                                                                       
  1003228  Siding Spring                      2013 A1                           
  9037734  ISON_NG1                                                             
  9037735  ISON_NG2                                                             
  2000001                                                                       
  2000004                                                                       
  2000016  Psyche (mission target)                                              
  2000253                                                                       
  2000433                                                                       
  2006489  6489 Golevka (1991 JX)                          6489                 
  2101955  101955 Bennu (1999 RQ36)                        3022034 J99R36Q      
  2002867                                                                       
  2099942                                                                       
  2486958  Arrokoth                                                             
  9901489  2018_AV2 (spacecraft)                                                
  9901490  9O0DC57 (spacecraft)                                                 
  9901885  9U01FF6 (spacecraft)                                                 
 -9901491  Tianwen-1 (spacecraft)                                               
 -9901492  Luna-25 STAGE (spacecraft)                                           
 20152830                                                                       
 20000617  Patroclus (system barycenter)                                        
920000617  Patroclus (primary body)                                             
120000617  Menoetius                          Patroclus I                       
 20011351                                                                       
 20015094                                                                       
 20021900                                                                       
 20052246                                                                       
 20050000  Quaoar (system barycenter)                                           
920050000  Quaoar (primary body)                                                
120050000  Weywot                                          Quaoar I             
 20065803  Didymos (system barycenter)                                          
920065803  Didymos (primary body)                                               
120065803  Dimorphos                                       Didymos I            
 20090482  Orcus (system barycenter)                                            
920090482  Orcus (primary body)                                                 
120090482  Vanth                                           Orcus I              
 20120347  Salacia (system barycenter)                                          
920120347  Salacia (primary body)                                               
120120347  Actaea                                          Salacia I            
 20136108  Haumea (system barycenter)                                           
920136108  Haumea (primary body)                                                
120136108  Hi'iaka                                         Haumea I             
220136108  Namaka                                          Haumea II            
 20136199  Eris (system barycenter)                                             
920136199  Eris (primary body)                                                  
120136199  Dysnomia                                        Eris I               
 20469705  |=Kagara (system barycenter)                                         
920469705  |=Kagara (primary body)                                              
120469705  Haunu                                           |=Kagara I           
 20612687  2003 UN284 (system barycenter)                                       
920612687  2003 UN284 (primary body)                                            
120612687  2003 UN284 1                                                         
 20612095  1999 OJ4 (system barycenter)                                         
920612095  1999 OJ4 (primary body)                                              
120612095  1999 OJ4 1                                                           
 53031823  1998 WW31 (system barycenter)                                        
953031823  1998 WW31 (primary body)                                             
153031823  1998 WW31 1                                                          
 53092511  2001 QW322 (system barycenter)                                       
953092511  2001 QW322 (primary body)                                            
153092511  2001 QW322 1                                                         
920003548                                                                       */
