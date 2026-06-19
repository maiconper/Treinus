-- V14: Adiciona gif_url ao catálogo de exercícios + preenche descrições e imagens
-- Imagens: free-exercise-db (yuhonas/free-exercise-db no GitHub) — fotos estáticas JPG

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS gif_url VARCHAR(500);

-- ── PEITO ──────────────────────────────────────────────────────────────────

UPDATE exercises SET
  description = 'Deite no banco, segure a barra na largura dos ombros e desça controlando até o peito, mantendo os cotovelos a ~75°. Empurre até a extensão completa contraindo o peitoral.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg'
WHERE name = 'Supino reto com barra' AND is_global;

UPDATE exercises SET
  description = 'Como o supino reto, mas com o banco inclinado a 30–45°, aumentando o recrutamento do peitoral superior e deltóide anterior.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg'
WHERE name = 'Supino inclinado com barra' AND is_global;

UPDATE exercises SET
  description = 'Banco declinado a ~15–30°, enfatiza o peitoral inferior. Controle a descida e mantenha os glúteos apoiados no banco durante todo o movimento.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Barbell_Bench_Press/0.jpg'
WHERE name = 'Supino declinado com barra' AND is_global;

UPDATE exercises SET
  description = 'Halteres permitem maior amplitude que a barra. Desça até a linha do peito e pressione para cima, aproximando os braços no topo sem bater os halteres.'
WHERE name = 'Supino reto com halteres' AND is_global;

UPDATE exercises SET
  description = 'Banco inclinado 30–45°. Halteres permitem rotação natural do punho ao pressionar, reduzindo o estresse no ombro em comparação com a barra.'
WHERE name = 'Supino inclinado com halteres' AND is_global;

UPDATE exercises SET
  description = 'Deitado, abra os braços em arco controlado com leve flexão nos cotovelos, descendo até sentir o peitoral em tensão. Feche o arco para cima sem bater os halteres.'
WHERE name = 'Crucifixo plano' AND is_global;

UPDATE exercises SET
  description = 'Mesmo padrão do crucifixo plano com banco a 30–45°, priorizando o peitoral superior (feixe clavicular). Controle a abertura para não forçar o ombro.'
WHERE name = 'Crucifixo inclinado' AND is_global;

UPDATE exercises SET
  description = 'Polias altas; puxe os cabos em arco para baixo e ao centro com leve inclinação do tronco à frente. Isola o peitoral inferior com tensão constante.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crossover/0.jpg'
WHERE name = 'Crossover alto' AND is_global;

UPDATE exercises SET
  description = 'Polias baixas; puxe em arco para cima e ao centro, isolando o peitoral superior (feixe clavicular). Mantenha os cotovelos levemente flexionados.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crossover/0.jpg'
WHERE name = 'Crossover baixo' AND is_global;

UPDATE exercises SET
  description = 'Máquina de abraçamento; mantenha os cotovelos na altura dos ombros e traga os braços à frente sem bater o peso. Controle a volta para manter a tensão.'
WHERE name = 'Peck deck' AND is_global;

UPDATE exercises SET
  description = 'Versão guiada do supino. Ideal para treinar até a falha com segurança, para iniciantes aprenderem o padrão ou como exercício complementar ao final do treino.'
WHERE name = 'Supino máquina' AND is_global;

UPDATE exercises SET
  description = 'Corpo rígido como prancha, desça até o peito quase tocar o chão mantendo os cotovelos próximos ao corpo (~45°). Empurre de volta à extensão completa.'
WHERE name = 'Flexão de braço' AND is_global;

UPDATE exercises SET
  description = 'Pés elevados em uma superfície. A inclinação muda o ângulo do movimento, recrutando mais peitoral inferior e deltóide anterior que a flexão convencional.'
WHERE name = 'Flexão inclinada' AND is_global;

UPDATE exercises SET
  description = 'Incline o tronco para frente ao descer para priorizar o peitoral inferior. Desça até os ombros ficarem abaixo dos cotovelos; evite hiperestender o ombro.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dips_-_Chest_Version/0.jpg'
WHERE name = 'Mergulho entre barras (peito)' AND is_global;

-- ── COSTAS ─────────────────────────────────────────────────────────────────

UPDATE exercises SET
  description = 'Pegada pronada (palmas para frente) na largura dos ombros. Puxe o corpo até o queixo passar a barra, contraindo o grande dorsal. Desça de forma controlada.'
WHERE name = 'Barra fixa pronada' AND is_global;

UPDATE exercises SET
  description = 'Pegada supinada (palmas voltadas para você). Facilita a rotação do úmero e recruta mais bíceps que a pronada. Excelente combinação de bíceps e costas.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Chin-Up/0.jpg'
WHERE name = 'Barra fixa supinada' AND is_global;

UPDATE exercises SET
  description = 'Sentado na máquina, puxe a barra até a parte superior do peito com o tronco levemente reclinado. Controle a subida para não usar impulso.'
WHERE name = 'Puxada frontal' AND is_global;

UPDATE exercises SET
  description = 'Puxada com pegada neutra (palmas se olhando). Ângulo mais ergonômico para os ombros; ative o grande dorsal antes de iniciar o puxe para proteger a articulação.'
WHERE name = 'Puxada neutra' AND is_global;

UPDATE exercises SET
  description = 'Tronco inclinado ~45°. Puxe a barra em direção ao umbigo mantendo as costas neutras e retraindo as escápulas ao final de cada repetição.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/0.jpg'
WHERE name = 'Remada curvada com barra' AND is_global;

UPDATE exercises SET
  description = 'Apoie um joelho e a mão ipsilateral no banco. Puxe o haltere até o quadril com o cotovelo próximo do corpo, retraindo a escápula no ponto final.'
WHERE name = 'Remada unilateral com haltere' AND is_global;

UPDATE exercises SET
  description = 'Remada em máquina com apoio para o peito. Isola o grande dorsal e romboides sem sobrecarregar a lombar. Ideal para volume alto e treino de failura.'
WHERE name = 'Remada cavalinho' AND is_global;

UPDATE exercises SET
  description = 'Puxe o cabo em direção ao abdômen em posição sentada. Retraia as escápulas e contraia o meio das costas ao final; controle a volta com tensão.'
WHERE name = 'Remada sentado cabo' AND is_global;

UPDATE exercises SET
  description = 'Com joelhos dobrados e costas neutras, empurre o chão com os pés estendendo quadril e joelhos simultaneamente para levantar a barra. O movimento mais completo da musculação.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/0.jpg'
WHERE name = 'Levantamento terra' AND is_global;

UPDATE exercises SET
  description = 'Pernas com joelhos levemente flexionados. Empurre o quadril para trás descendo a barra pelas pernas; sinta a forte tensão nos isquiotibiais antes de subir.'
WHERE name = 'Levantamento terra romeno' AND is_global;

UPDATE exercises SET
  description = 'No banco romano, desça o tronco com controle até ~90° e suba contraindo os eretores da espinha e os glúteos. Não hiperestenda a lombar no ponto superior.'
WHERE name = 'Hiperextensão lombar' AND is_global;

UPDATE exercises SET
  description = 'Polia alta com corda. Puxe até a altura dos olhos abrindo os cotovelos para cima e para fora, pinçando as escápulas. Fundamental para saúde do manguito rotador.'
WHERE name = 'Face pull' AND is_global;

-- ── PERNAS ─────────────────────────────────────────────────────────────────

UPDATE exercises SET
  description = 'Pés na largura dos ombros com pontas levemente para fora. Desça controlando até as coxas ficarem paralelas ao chão, mantendo o tronco o mais vertical possível.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg'
WHERE name = 'Agachamento livre' AND is_global;

UPDATE exercises SET
  description = 'Segure um haltere verticalmente à frente do peito como um cálice. A posição favorece o tronco ereto, tornando o padrão do agachamento mais acessível e seguro.'
WHERE name = 'Agachamento goblet' AND is_global;

UPDATE exercises SET
  description = 'Pés no centro da plataforma. Desça até as coxas formarem 90° com as pernas. Não destranque completamente os joelhos no topo. Varie a posição dos pés para direcionar músculos.'
WHERE name = 'Leg press 45°' AND is_global;

UPDATE exercises SET
  description = 'Cadeira de extensão: isolamento puro do quadríceps. Estenda as pernas até quase travar o joelho e controle a descida. Evite usar impulso ou velocidade excessiva.'
WHERE name = 'Extensão de joelho' AND is_global;

UPDATE exercises SET
  description = 'Barra posicionada atrás das coxas na máquina hack. A postura mais vertical permite foco intenso no quadríceps com menor carga na lombar que o agachamento livre.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hack_Squat/0.jpg'
WHERE name = 'Agachamento hack' AND is_global;

UPDATE exercises SET
  description = 'Passo à frente, desça o joelho traseiro próximo ao chão sem tocar. Mantenha o tronco ereto e o joelho dianteiro alinhado com o pé. Alterne os lados a cada rep.'
WHERE name = 'Avanço com halteres' AND is_global;

UPDATE exercises SET
  description = 'Passo longo estático. Quanto maior o passo, maior o recrutamento de glúteos e isquiotibiais. Passo menor foca mais no quadríceps. Mantenha o core firme.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Lunge/0.jpg'
WHERE name = 'Passada' AND is_global;

UPDATE exercises SET
  description = 'Sentado na cadeira flexora, curve as pernas contra a almofada. Isola os isquiotibiais com menor risco lombar que a mesa flexora. Controle a descida.'
WHERE name = 'Cadeira flexora' AND is_global;

UPDATE exercises SET
  description = 'Deitado de bruços, curve as pernas contra a resistência. Esse ângulo proporciona maior alongamento do isquiotibial que a cadeira flexora, aumentando a amplitude útil.'
WHERE name = 'Mesa flexora' AND is_global;

UPDATE exercises SET
  description = 'Pernas com joelhos levemente flexionados. Empurre o quadril para trás descendo a barra na frente das pernas. Recrutamento intenso de isquiotibiais e eretores da espinha.'
WHERE name = 'Stiff com barra' AND is_global;

UPDATE exercises SET
  description = 'Versão com halteres do stiff. Permite maior amplitude de movimento e rotação neutra dos punhos, sendo uma opção mais acessível para iniciantes.'
WHERE name = 'Stiff com halteres' AND is_global;

UPDATE exercises SET
  description = 'Pé traseiro elevado em um banco. Desça até o joelho dianteiro quase tocar o chão. Altamente desafiador para equilíbrio e força unilateral de quadríceps e glúteos.'
WHERE name = 'Agachamento búlgaro' AND is_global;

UPDATE exercises SET
  description = 'Sentado na máquina, una as coxas contra a resistência das almofadas. Isola os adutores internos da coxa; controle a volta sem bater o peso.'
WHERE name = 'Adutor máquina' AND is_global;

UPDATE exercises SET
  description = 'Sentado na máquina, abra as coxas contra a resistência. Isola o glúteo médio e abdutores; fundamental para estabilidade do quadril e proteção do joelho.'
WHERE name = 'Abdutor máquina' AND is_global;

-- ── GLÚTEOS ────────────────────────────────────────────────────────────────

UPDATE exercises SET
  description = 'Apoie as escápulas no banco com a barra sobre o quadril (use proteção). Empurre o quadril para cima até a extensão completa, contraindo os glúteos no ponto máximo.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hip_Thrust/0.jpg'
WHERE name = 'Hip thrust com barra' AND is_global;

UPDATE exercises SET
  description = 'Versão guiada do hip thrust. Controle o range de movimento e adicione carga progressiva com mais segurança e estabilidade que a versão com barra livre.'
WHERE name = 'Hip thrust na máquina' AND is_global;

UPDATE exercises SET
  description = 'Deitado no chão com pés apoiados. Eleve o quadril até a extensão completa contraindo os glúteos. Versão mais acessível e segura que o hip thrust com barra.'
WHERE name = 'Elevação pélvica' AND is_global;

UPDATE exercises SET
  description = 'De quatro apoios ou em pé com tornozeleira no cabo, empurre a perna para trás e para cima em extensão completa do quadril. Isola o glúteo máximo.'
WHERE name = 'Kick back no cabo' AND is_global;

UPDATE exercises SET
  description = 'Em pé, puxe a perna para o lado contra a resistência do cabo. Fortalece o glúteo médio, essencial para estabilidade do quadril durante corrida e agachamento.'
WHERE name = 'Abdução de quadril cabo' AND is_global;

UPDATE exercises SET
  description = 'Pés muito afastados com pontas para fora (~45°). A posição larga transfere mais trabalho para glúteos e adutores que o agachamento convencional.'
WHERE name = 'Agachamento sumô' AND is_global;

-- ── OMBROS ─────────────────────────────────────────────────────────────────

UPDATE exercises SET
  description = 'Em pé ou sentado, empurre a barra acima da cabeça com pegada na largura dos ombros. Mantenha o core contraído e evite arquear a lombar ao pressionar.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Shoulder_Press/0.jpg'
WHERE name = 'Desenvolvimento com barra' AND is_global;

UPDATE exercises SET
  description = 'Alternados ou simultâneos. Permite rotação natural do punho ao pressionar, distribuindo melhor a carga e reduzindo o estresse na articulação acromioclavicular.'
WHERE name = 'Desenvolvimento com halteres' AND is_global;

UPDATE exercises SET
  description = 'Inicie com palmas voltadas para você e cotovelos baixos. Ao pressionar, gire externamente (palmas para frente no topo). Recruta as três cabeças do deltóide.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Arnold_Dumbbell_Press/0.jpg'
WHERE name = 'Desenvolvimento Arnold' AND is_global;

UPDATE exercises SET
  description = 'Halteres nas laterais do corpo, eleve até a linha dos ombros com cotovelos levemente flexionados. Isola o deltóide lateral; não use impulso do tronco.'
WHERE name = 'Elevação lateral' AND is_global;

UPDATE exercises SET
  description = 'Versão com cabo da elevação lateral. A polia oferece tensão constante no deltóide lateral em toda a amplitude, incluindo o ponto mais baixo onde o haltere alivia.'
WHERE name = 'Elevação lateral no cabo' AND is_global;

UPDATE exercises SET
  description = 'Eleve o haltere à frente do corpo até a altura dos ombros com o cotovelo levemente flexionado. Isola principalmente o deltóide anterior.'
WHERE name = 'Elevação frontal' AND is_global;

UPDATE exercises SET
  description = 'Versão guiada do desenvolvimento em máquina. Ideal para altas repetições, treino até a falha ou quando há desconforto no ombro com peso livre.'
WHERE name = 'Desenvolvimento máquina' AND is_global;

UPDATE exercises SET
  description = 'Barra próxima ao corpo, cotovelos acima dos ombros ao subir. Recruta trapézio e deltóide lateral. Use pegada mais afastada para proteger a articulação do ombro.'
WHERE name = 'Remada alta com barra' AND is_global;

-- ── BRAÇOS ─────────────────────────────────────────────────────────────────

UPDATE exercises SET
  description = 'Cotovelos fixos ao lado do corpo. Curve a barra até os bíceps ficarem totalmente contraídos, supinando o antebraço ao longo do movimento para máximo recrutamento.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Curl/0.jpg'
WHERE name = 'Rosca direta com barra' AND is_global;

UPDATE exercises SET
  description = 'Halteres alternados com supinação completa do antebraço (polegar para fora ao subir). Permite maior amplitude de movimento e pico de contração do bíceps.'
WHERE name = 'Rosca alternada' AND is_global;

UPDATE exercises SET
  description = 'Pegada neutra (polegar aponta para cima) durante todo o movimento. Recruta principalmente o braquial e braquiorradial, complementando o trabalho do bíceps braquial.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Alternate_Hammer_Curl/0.jpg'
WHERE name = 'Rosca martelo' AND is_global;

UPDATE exercises SET
  description = 'Cotovelo apoiado na face interna da coxa, sentado. Mova o haltere em arco limpo sem balançar o tronco, isolando ao máximo o bíceps.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Concentration_Curls/0.jpg'
WHERE name = 'Rosca concentrada' AND is_global;

UPDATE exercises SET
  description = 'Braços apoiados no banco inclinado Scott. Elimina o balanço do tronco e sobrecarrega o bíceps na porção inferior do movimento, onde normalmente há pouca tensão.'
WHERE name = 'Rosca scott' AND is_global;

UPDATE exercises SET
  description = 'Polia baixa com barra reta, EZ ou corda. Tensão constante em todo o arco do movimento, sem o alívio que ocorre com halteres no ponto superior.'
WHERE name = 'Rosca no cabo' AND is_global;

UPDATE exercises SET
  description = 'Deitado no banco, desça a barra em direção à testa controlando os cotovelos (apontados para o teto). Estenda completamente os cotovelos ao subir para contrair o tríceps.'
WHERE name = 'Tríceps testa' AND is_global;

UPDATE exercises SET
  description = 'Polia alta com barra reta. Empurre para baixo mantendo os cotovelos fixos ao lado do tronco até a extensão total. Não deixe os cotovelos saírem para os lados.'
WHERE name = 'Tríceps pulley' AND is_global;

UPDATE exercises SET
  description = 'Polia alta com corda. No ponto mais baixo, abra as mãos para fora em diagonal, maximizando a contração da cabeça lateral do tríceps. Cotovelos fixos.'
WHERE name = 'Tríceps corda' AND is_global;

UPDATE exercises SET
  description = 'Sentado ou em pé, desça o haltere atrás da cabeça mantendo os cotovelos apontados para cima. Amplitude total do movimento; respeite a mobilidade do ombro.'
WHERE name = 'Tríceps francês' AND is_global;

UPDATE exercises SET
  description = 'Tronco ereto, mãos na largura dos ombros. Desça até 90° de flexão no cotovelo e empurre de volta. Tronco vertical durante todo o movimento prioriza o tríceps.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dips_-_Triceps_Version/0.jpg'
WHERE name = 'Mergulho no banco (tríceps)' AND is_global;

UPDATE exercises SET
  description = 'Tronco inclinado à frente com cotovelo fixo ao lado do corpo. Estenda o braço completamente para trás até o alinhamento, contraindo o tríceps no ponto superior.'
WHERE name = 'Tríceps coice' AND is_global;

-- ── CORE ───────────────────────────────────────────────────────────────────

UPDATE exercises SET
  description = 'Deitado com joelhos dobrados e pés apoiados. Eleve o tronco contraindo o reto abdominal sem puxar o pescoço com as mãos. Pare ao atingir cerca de 30° do chão.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crunches/0.jpg'
WHERE name = 'Abdominal supra' AND is_global;

UPDATE exercises SET
  description = 'Deitado com mãos ao lado do quadril. Eleve os joelhos em direção ao peito contraindo o baixo abdômen. Desça sem deixar os pés tocarem o chão entre as reps.'
WHERE name = 'Abdominal infra' AND is_global;

UPDATE exercises SET
  description = 'Crunch com rotação: ao subir, direcione o cotovelo em direção ao joelho oposto. Ativa os oblíquos externos e internos de forma combinada com o reto abdominal.'
WHERE name = 'Abdominal oblíquo' AND is_global;

UPDATE exercises SET
  description = 'Posição de flexão com apoio nos antebraços. Mantenha o corpo em linha reta da cabeça aos pés, contraindo o core e os glúteos. Não afunde o quadril nem levante demais.'
WHERE name = 'Prancha' AND is_global;

UPDATE exercises SET
  description = 'Apoio no antebraço lateral e na borda lateral do pé inferior. Mantenha o quadril elevado e o alinhamento da coluna. Desenvolve oblíquos e glúteo médio.'
WHERE name = 'Prancha lateral' AND is_global;

UPDATE exercises SET
  description = 'Alternância ritmada de cotovelo com joelho oposto em movimento de pedalada. Combina reto abdominal e oblíquos com alta demanda neuromuscular e calórica.'
WHERE name = 'Abdominal bicicleta' AND is_global;

UPDATE exercises SET
  description = 'Versão guiada do crunch em máquina. Permite adicionar sobrecarga progressiva ao reto abdominal sem tensionar o pescoço, ideal para progressão de carga.'
WHERE name = 'Crunch na máquina' AND is_global;

UPDATE exercises SET
  description = 'Ajoelhado com polia alta, curve o tronco em direção ao chão contraindo o reto abdominal. A sobrecarga progressiva é o principal diferencial para hipertrofia do core.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crunch/0.jpg'
WHERE name = 'Abdominal no cabo' AND is_global;

UPDATE exercises SET
  description = 'Deitado ou suspenso na barra, eleve as pernas estendidas até 90°. Versão com joelhos é a mais fácil. Ativa fortemente o reto abdominal inferior e o iliopsoas.'
WHERE name = 'Elevação de pernas' AND is_global;

UPDATE exercises SET
  description = 'Sentado com tronco a ~45° e pés levemente elevados. Rotacione o tronco de lado a lado tocando o peso no chão. Treina oblíquos sob carga em amplitude funcional.'
WHERE name = 'Russian twist' AND is_global;

-- ── PANTURRILHA ────────────────────────────────────────────────────────────

UPDATE exercises SET
  description = 'Máquina de panturrilha em pé. Suba na ponta dos pés até a extensão completa e desça abaixo do nível da plataforma para amplitude total. Recrutamento máximo do gastrocnêmio.'
WHERE name = 'Panturrilha em pé' AND is_global;

UPDATE exercises SET
  description = 'Joelhos dobrados a 90° na máquina sentada. Essa posição recruta principalmente o sóleo (músculo profundo). Use para complementar a panturrilha em pé.'
WHERE name = 'Panturrilha sentado' AND is_global;

UPDATE exercises SET
  description = 'Pés na borda inferior da plataforma do leg press. Empurre as pontas dos pés até a extensão completa do tornozelo. Permite carga alta com boa amplitude de movimento.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Calf_Press_On_The_Leg_Press_Machine/0.jpg'
WHERE name = 'Panturrilha no leg press' AND is_global;

UPDATE exercises SET
  description = 'Em pé no degrau ou no chão usando o peso corporal. Ideal para volume alto ou como finalizador. Descida lenta (4 segundos) aumenta o alongamento e a hipertrofia.'
WHERE name = 'Panturrilha livre' AND is_global;

-- ── CARDIO ─────────────────────────────────────────────────────────────────

UPDATE exercises SET
  description = 'Cardio aeróbico de baixo a alto impacto. Ajuste velocidade e inclinação: 5–6 km/h para caminhada, 8–12 km/h para corrida moderada, sprints para HIIT.'
WHERE name = 'Corrida na esteira' AND is_global;

UPDATE exercises SET
  description = 'Cardio de baixo impacto nas articulações, preservando joelhos e quadris. Ajuste a resistência para trabalho aeróbico constante (zona 2) ou intervalos de alta intensidade.'
WHERE name = 'Bicicleta ergométrica' AND is_global;

UPDATE exercises SET
  description = 'Cardio de corpo todo que coordena pernas, core e braços em um único movimento encadeado. Alta queima calórica com menor impacto articular que a corrida.'
WHERE name = 'Remo ergométrico' AND is_global;

UPDATE exercises SET
  description = 'Alta intensidade e coordenação motora. Queima calórica elevada em pouco tempo. Comece com saltos básicos e evolua para variações de velocidade e padrões cruzados.'
WHERE name = 'Pular corda' AND is_global;

UPDATE exercises SET
  description = 'Simula a subida de escadas com baixo impacto articular. Forte recrutamento de glúteos, quadríceps e elevação cardíaca sustentada ao longo da sessão.'
WHERE name = 'Escada rolante' AND is_global;

-- ── CORPO TODO ─────────────────────────────────────────────────────────────

UPDATE exercises SET
  description = 'Do agachamento ao salto passando pela posição de flexão: exercício de alta intensidade que combina força e cardio em um único movimento contínuo.'
WHERE name = 'Burpee' AND is_global;

UPDATE exercises SET
  description = 'Empurre o quadril explosivamente para frente, deixando o kettlebell oscilar até a altura dos ombros pela força do quadril — não dos braços. Movimento hip hinge fundamental.'
WHERE name = 'Kettlebell swing' AND is_global;

UPDATE exercises SET
  description = 'Movimento complexo de chão ao pé em 7 etapas, mantendo o kettlebell acima da cabeça. Desenvolve estabilidade de ombro, core e mobilidade total do corpo.'
WHERE name = 'Turkish get-up' AND is_global;

UPDATE exercises SET
  description = 'Combinação de agachamento frontal imediatamente seguido de desenvolvimento acima da cabeça em um único gesto explosivo. Alta demanda cardiovascular e de força total.'
WHERE name = 'Thruster' AND is_global;

UPDATE exercises SET
  description = 'Levantamento olímpico em dois tempos: limpa a barra até os ombros (clean) e depois empurra acima da cabeça (jerk). Requer técnica específica; aprenda com progressões.',
  gif_url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Clean_and_Jerk/0.jpg'
WHERE name = 'Clean and jerk' AND is_global;

UPDATE exercises SET
  description = 'Posição sumo: pegada entre as pernas afastadas. Menor demanda de mobilidade do quadril e maior recrutamento de adutores e glúteos comparado à versão convencional.'
WHERE name = 'Levantamento terra sumo' AND is_global;
