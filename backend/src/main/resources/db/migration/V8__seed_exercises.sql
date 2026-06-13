-- Seed: catálogo global de exercícios
INSERT INTO exercises (name, category, primary_muscle_group, equipment, is_global) VALUES

-- ── PEITO ──────────────────────────────────────────────────────────────────
('Supino reto com barra',         'CHEST', 'Peitoral maior',      'BARBELL',    TRUE),
('Supino inclinado com barra',    'CHEST', 'Peitoral superior',   'BARBELL',    TRUE),
('Supino declinado com barra',    'CHEST', 'Peitoral inferior',   'BARBELL',    TRUE),
('Supino reto com halteres',      'CHEST', 'Peitoral maior',      'DUMBBELL',   TRUE),
('Supino inclinado com halteres', 'CHEST', 'Peitoral superior',   'DUMBBELL',   TRUE),
('Crucifixo plano',               'CHEST', 'Peitoral maior',      'DUMBBELL',   TRUE),
('Crucifixo inclinado',           'CHEST', 'Peitoral superior',   'DUMBBELL',   TRUE),
('Crossover alto',                'CHEST', 'Peitoral inferior',   'CABLE',      TRUE),
('Crossover baixo',               'CHEST', 'Peitoral superior',   'CABLE',      TRUE),
('Peck deck',                     'CHEST', 'Peitoral maior',      'MACHINE',    TRUE),
('Supino máquina',                'CHEST', 'Peitoral maior',      'MACHINE',    TRUE),
('Flexão de braço',               'CHEST', 'Peitoral maior',      'BODYWEIGHT', TRUE),
('Flexão inclinada',              'CHEST', 'Peitoral inferior',   'BODYWEIGHT', TRUE),
('Mergulho entre barras (peito)', 'CHEST', 'Peitoral inferior',   'BODYWEIGHT', TRUE),

-- ── COSTAS ─────────────────────────────────────────────────────────────────
('Barra fixa pronada',            'BACK', 'Grande dorsal',        'BODYWEIGHT', TRUE),
('Barra fixa supinada',           'BACK', 'Grande dorsal',        'BODYWEIGHT', TRUE),
('Puxada frontal',                'BACK', 'Grande dorsal',        'MACHINE',    TRUE),
('Puxada neutra',                 'BACK', 'Grande dorsal',        'MACHINE',    TRUE),
('Remada curvada com barra',      'BACK', 'Grande dorsal',        'BARBELL',    TRUE),
('Remada unilateral com haltere', 'BACK', 'Grande dorsal',        'DUMBBELL',   TRUE),
('Remada cavalinho',              'BACK', 'Grande dorsal',        'MACHINE',    TRUE),
('Remada sentado cabo',           'BACK', 'Romboides',            'CABLE',      TRUE),
('Levantamento terra',            'BACK', 'Eretores da espinha',  'BARBELL',    TRUE),
('Levantamento terra romeno',     'BACK', 'Eretores da espinha',  'BARBELL',    TRUE),
('Hiperextensão lombar',          'BACK', 'Eretores da espinha',  'MACHINE',    TRUE),
('Face pull',                     'BACK', 'Romboides / manguito', 'CABLE',      TRUE),

-- ── PERNAS ─────────────────────────────────────────────────────────────────
('Agachamento livre',             'LEGS', 'Quadríceps',           'BARBELL',    TRUE),
('Agachamento goblet',            'LEGS', 'Quadríceps',           'DUMBBELL',   TRUE),
('Leg press 45°',                 'LEGS', 'Quadríceps',           'MACHINE',    TRUE),
('Extensão de joelho',            'LEGS', 'Quadríceps',           'MACHINE',    TRUE),
('Agachamento hack',              'LEGS', 'Quadríceps',           'MACHINE',    TRUE),
('Avanço com halteres',           'LEGS', 'Quadríceps',           'DUMBBELL',   TRUE),
('Passada',                       'LEGS', 'Quadríceps',           'BARBELL',    TRUE),
('Cadeira flexora',               'LEGS', 'Isquiotibiais',        'MACHINE',    TRUE),
('Mesa flexora',                  'LEGS', 'Isquiotibiais',        'MACHINE',    TRUE),
('Stiff com barra',               'LEGS', 'Isquiotibiais',        'BARBELL',    TRUE),
('Stiff com halteres',            'LEGS', 'Isquiotibiais',        'DUMBBELL',   TRUE),
('Agachamento búlgaro',           'LEGS', 'Quadríceps / glúteos', 'DUMBBELL',   TRUE),
('Adutor máquina',                'LEGS', 'Adutores',             'MACHINE',    TRUE),
('Abdutor máquina',               'LEGS', 'Abdutores',            'MACHINE',    TRUE),

-- ── GLÚTEOS ────────────────────────────────────────────────────────────────
('Hip thrust com barra',          'GLUTES', 'Glúteo máximo',      'BARBELL',    TRUE),
('Hip thrust na máquina',         'GLUTES', 'Glúteo máximo',      'MACHINE',    TRUE),
('Elevação pélvica',              'GLUTES', 'Glúteo máximo',      'BODYWEIGHT', TRUE),
('Kick back no cabo',             'GLUTES', 'Glúteo máximo',      'CABLE',      TRUE),
('Abdução de quadril cabo',       'GLUTES', 'Glúteo médio',       'CABLE',      TRUE),
('Agachamento sumô',              'GLUTES', 'Glúteo / adutores',  'BARBELL',    TRUE),

-- ── OMBROS ─────────────────────────────────────────────────────────────────
('Desenvolvimento com barra',     'SHOULDERS', 'Deltóide anterior',  'BARBELL',  TRUE),
('Desenvolvimento com halteres',  'SHOULDERS', 'Deltóide anterior',  'DUMBBELL', TRUE),
('Desenvolvimento Arnold',        'SHOULDERS', 'Deltóide completo',  'DUMBBELL', TRUE),
('Elevação lateral',              'SHOULDERS', 'Deltóide lateral',   'DUMBBELL', TRUE),
('Elevação lateral no cabo',      'SHOULDERS', 'Deltóide lateral',   'CABLE',    TRUE),
('Elevação frontal',              'SHOULDERS', 'Deltóide anterior',  'DUMBBELL', TRUE),
('Desenvolvimento máquina',       'SHOULDERS', 'Deltóide',           'MACHINE',  TRUE),
('Remada alta com barra',         'SHOULDERS', 'Trapézio / deltóide','BARBELL',  TRUE),

-- ── BRAÇOS ─────────────────────────────────────────────────────────────────
('Rosca direta com barra',        'ARMS', 'Bíceps',               'BARBELL',    TRUE),
('Rosca alternada',               'ARMS', 'Bíceps',               'DUMBBELL',   TRUE),
('Rosca martelo',                 'ARMS', 'Braquial / bíceps',    'DUMBBELL',   TRUE),
('Rosca concentrada',             'ARMS', 'Bíceps',               'DUMBBELL',   TRUE),
('Rosca scott',                   'ARMS', 'Bíceps',               'BARBELL',    TRUE),
('Rosca no cabo',                 'ARMS', 'Bíceps',               'CABLE',      TRUE),
('Tríceps testa',                 'ARMS', 'Tríceps',              'BARBELL',    TRUE),
('Tríceps pulley',                'ARMS', 'Tríceps',              'CABLE',      TRUE),
('Tríceps corda',                 'ARMS', 'Tríceps',              'CABLE',      TRUE),
('Tríceps francês',               'ARMS', 'Tríceps',              'DUMBBELL',   TRUE),
('Mergulho no banco (tríceps)',   'ARMS', 'Tríceps',              'BODYWEIGHT', TRUE),
('Tríceps coice',                 'ARMS', 'Tríceps',              'DUMBBELL',   TRUE),

-- ── CORE ───────────────────────────────────────────────────────────────────
('Abdominal supra',               'CORE', 'Reto abdominal',       'BODYWEIGHT', TRUE),
('Abdominal infra',               'CORE', 'Reto abdominal',       'BODYWEIGHT', TRUE),
('Abdominal oblíquo',             'CORE', 'Oblíquos',             'BODYWEIGHT', TRUE),
('Prancha',                       'CORE', 'Core completo',        'BODYWEIGHT', TRUE),
('Prancha lateral',               'CORE', 'Oblíquos',             'BODYWEIGHT', TRUE),
('Abdominal bicicleta',           'CORE', 'Oblíquos / reto',      'BODYWEIGHT', TRUE),
('Crunch na máquina',             'CORE', 'Reto abdominal',       'MACHINE',    TRUE),
('Abdominal no cabo',             'CORE', 'Reto abdominal',       'CABLE',      TRUE),
('Elevação de pernas',            'CORE', 'Reto abdominal inf.',  'BODYWEIGHT', TRUE),
('Russian twist',                 'CORE', 'Oblíquos',             'BODYWEIGHT', TRUE),

-- ── PANTURRILHA ────────────────────────────────────────────────────────────
('Panturrilha em pé',             'CALVES', 'Gastrocnêmio',       'MACHINE',    TRUE),
('Panturrilha sentado',           'CALVES', 'Sóleo',              'MACHINE',    TRUE),
('Panturrilha no leg press',      'CALVES', 'Gastrocnêmio',       'MACHINE',    TRUE),
('Panturrilha livre',             'CALVES', 'Gastrocnêmio',       'BODYWEIGHT', TRUE),

-- ── CARDIO ─────────────────────────────────────────────────────────────────
('Corrida na esteira',            'CARDIO', 'Corpo todo',         'OTHER',      TRUE),
('Bicicleta ergométrica',         'CARDIO', 'Pernas',             'OTHER',      TRUE),
('Remo ergométrico',              'CARDIO', 'Corpo todo',         'OTHER',      TRUE),
('Pular corda',                   'CARDIO', 'Corpo todo',         'BODYWEIGHT', TRUE),
('Escada rolante',                'CARDIO', 'Pernas / glúteos',   'OTHER',      TRUE),

-- ── CORPO TODO ─────────────────────────────────────────────────────────────
('Burpee',                        'FULL_BODY', 'Corpo todo',      'BODYWEIGHT', TRUE),
('Kettlebell swing',              'FULL_BODY', 'Posterior / core','KETTLEBELL', TRUE),
('Turkish get-up',                'FULL_BODY', 'Core / ombros',   'KETTLEBELL', TRUE),
('Thruster',                      'FULL_BODY', 'Corpo todo',      'BARBELL',    TRUE),
('Clean and jerk',                'FULL_BODY', 'Corpo todo',      'BARBELL',    TRUE),
('Levantamento terra sumo',       'FULL_BODY', 'Posterior / pernas','BARBELL',  TRUE);
