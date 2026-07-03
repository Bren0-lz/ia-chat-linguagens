// Seed answer map parsed from db/migrations/005_v6_seed_exam.sql
// Each: {level, qtype, prompt, options, answer}
const Q = [
  ['A1','mc','I ___ a student.',["am","is","are","be"],'am'],
  ['A1','mc','She ___ from Brazil.',["am","is","are","be"],'is'],
  ['A1','mc','There ___ two cats in the room.',["is","am","are","be"],'are'],
  ['A1','written','Complete: "They ___ my friends." (verbo to be)',null,'are'],
  ['A1','written','Escreva o plural de "child".',null,'children'],
  ['A1','mc','What color is the sky?',["red","green","blue","yellow"],'blue'],
  ['A1','mc','How do you say "Bom dia"?',["Good night","Good afternoon","Hello","Good morning"],'Good morning'],
  ['A1','written','Traduza para inglês: "obrigado".',null,'thank you'],
  ['A1','mc','"My name is Ana. I am 8." How old is Ana?',["7","8","9","10"],'8'],
  ['A1','written','"I have a red car." What color is the car?',null,'red'],
  ['A2','mc','Yesterday I ___ to school.',["go","goes","went","gone"],'went'],
  ['A2','mc','___ you like pizza?',["Does","Do","Is","Are"],'Do'],
  ['A2','mc','She ___ TV every evening.',["watch","watches","watched","watching"],'watches'],
  ['A2','written','Passe para o passado: "I play football." → "I ___ football."',null,'played'],
  ['A2','written','Corrija: "I have 20 years." (idade)',null,'i am 20 years old'],
  ['A2','mc','What does "hungry" mean?',["com sono","com frio","com fome","com sede"],'com fome'],
  ['A2','mc','I go to school ___ bus.',["with","in","by","on"],'by'],
  ['A2','written','Traduza: "ontem".',null,'yesterday'],
  ['A2','mc','"Tom gets up at 7 and has breakfast." What does Tom do first?',["breakfast","get up","go to work","sleep"],'get up'],
  ['A2','written','"She lives in a small house near the park." Where is the house?',null,'near the park'],
  ['B1','mc','If I ___ more money, I would travel.',["have","had","has","would have"],'had'],
  ['B1','mc','Which uses Present Perfect correctly?',["I have seen it yesterday.","I have seen it.","I seen it.","I has seen it."],'I have seen it.'],
  ['B1','mc','She suggested ___ a taxi.',["take","to take","taking","took"],'taking'],
  ['B1','written','Complete no present perfect: "I ___ never ___ sushi." (eat)',null,'have never eaten'],
  ['B1','written','Passive: reescreva "They built this bridge." → "This bridge ___ ___."',null,'was built'],
  ['B1','mc','"nevertheless" means:',["therefore","however","because","although"],'however'],
  ['B1','mc','"to make up your mind" means:',["apply makeup","decide","recall","relax"],'decide'],
  ['B1','written','Dê um sinônimo de "big".',null,'large'],
  ['B1','mc','"Although it rained, they enjoyed the trip." Did they enjoy it?',["yes","no","maybe","unknown"],'yes'],
  ['B1','written','"The meeting was postponed to Friday." When is the meeting now?',null,'friday'],
  ['B2','mc','By the time she arrived, we ___ for two hours.',["had been waiting","have been waiting","were waiting","was waiting"],'had been waiting'],
  ['B2','mc','The man ___ called you is my uncle.',["which","who","whom","what"],'who'],
  ['B2','mc','He ___ have taken the keys — they are still here.',["must","can't","should","would"],"can't"],
  ['B2','written','Inversão: reescreva começando com "Not only": "She was late and she forgot the report." → "Not only ___ she late..."',null,'was'],
  ['B2','written','Reported speech: "I am tired," he said. → He said he ___ tired.',null,'was'],
  ['B2','mc','"ambiguous" is closest to:',["clear","confusing","reliable","obvious"],'confusing'],
  ['B2','mc','Formal alternative to "get in touch":',["phone","contact","ring","call"],'contact'],
  ['B2','written',"\"to pull someone's leg\" significa (uma palavra em português):",null,'brincar'],
  ['B2','mc','"The proposal was met with skepticism by the board." How did the board react?',["enthusiasm","skepticism","indifference","approval"],'skepticism'],
  ['B2','written','"Sales plummeted in Q3." Did sales go up or down?',null,'down'],
  ['C1','mc','___ he known the risk, he would never have agreed.',["If","Had","Should","Were"],'Had'],
  ['C1','mc','It is important that he ___ on time.',["is","be","will be","was"],'be'],
  ['C1','mc','The results were ___ from satisfactory.',["far","away","much","long"],'far'],
  ['C1','written','Inversão: reescreva começando com "Seldom": "I have seldom seen such talent." → "Seldom ___ I seen such talent."',null,'have'],
  ['C1','written','Cleft sentence: enfatize "John" em "John broke the window." → "It ___ John who broke the window."',null,'was'],
  ['C1','mc','"sycophantic" most closely means:',["rebellious","flattering and servile","outspoken","indifferent"],'flattering and servile'],
  ['C1','mc','"meticulous" means:',["careless","very careful","fast","rude"],'very careful'],
  ['C1','written','Dê um sinônimo formal de "begin".',null,'commence'],
  ['C1','mc','"Her argument, though cogent, failed to sway the committee." Was the argument convincing?',["yes, but it didn't persuade","no, it was weak","it was ignored","it was illegal"],"yes, but it didn't persuade"],
  ['C1','written','"The policy was ostensibly about safety." Does "ostensibly" suggest the real reason might differ? (yes/no)',null,'yes'],
];

const norm = s => String(s||'').toLowerCase().replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/[^a-z0-9]+/g,'');

// Given the rendered question text from Placement Engine, find the matching seed row.
function matchQuestion(renderText) {
  // strip a leading "✅ Acertou!.../➖" banner and the "Questão N/10" header
  let t = String(renderText||'');
  const nt = norm(t);
  let best = null, bestLen = 0;
  for (const [level, qtype, prompt, options, answer] of Q) {
    const np = norm(prompt);
    if (np.length > 8 && nt.indexOf(np) >= 0 && np.length > bestLen) {
      best = { level, qtype, prompt, options, answer };
      bestLen = np.length;
    }
  }
  return best;
}

module.exports = { Q, matchQuestion, norm };
