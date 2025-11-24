const truthTableBody = document.getElementById('truth-table-body');
const inputA = document.getElementById('input-a');
const inputB = document.getElementById('input-b');
const outputs = {
  and: document.getElementById('output-and'),
  or: document.getElementById('output-or'),
  nand: document.getElementById('output-nand'),
  nor: document.getElementById('output-nor'),
  xor: document.getElementById('output-xor'),
  not: document.getElementById('output-not')
};
const builderForm = document.getElementById('builder-form');
const builderOutput = document.getElementById('builder-output');
const gateSequenceField = document.getElementById('gate-sequence');
const initialInputsField = document.getElementById('initial-inputs');
const toggleTheme = document.getElementById('toggle-theme');
const stateA = document.getElementById('state-a');
const stateB = document.getElementById('state-b');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

const gates = {
  AND: (a, b) => Number(Boolean(a && b)),
  OR: (a, b) => Number(Boolean(a || b)),
  NAND: (a, b) => Number(!(a && b)),
  NOR: (a, b) => Number(!(a || b)),
  XOR: (a, b) => Number(Boolean(a) !== Boolean(b)),
  NOT: (a) => Number(!Boolean(a))
};

const gateDescriptions = {
  AND: 'Outputs 1 only when both inputs are 1.',
  OR: 'Outputs 1 when either input is 1.',
  NAND: 'Inverted AND: outputs 0 only when both inputs are 1.',
  NOR: 'Inverted OR: outputs 1 only when both inputs are 0.',
  XOR: 'Exclusive OR: outputs 1 when inputs differ.',
  NOT: 'Inverts the input signal.'
};

function renderTruthTable() {
  const combinations = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1]
  ];

  truthTableBody.innerHTML = combinations
    .map(([a, b]) => {
      const and = gates.AND(a, b);
      const or = gates.OR(a, b);
      const nand = gates.NAND(a, b);
      const nor = gates.NOR(a, b);
      const xor = gates.XOR(a, b);
      return `
        <tr>
          <td>${a}</td>
          <td>${b}</td>
          <td>${and}</td>
          <td>${or}</td>
          <td>${nand}</td>
          <td>${nor}</td>
          <td>${xor}</td>
        </tr>
      `;
    })
    .join('');
}

function updateVisualizer() {
  const a = inputA.checked ? 1 : 0;
  const b = inputB.checked ? 1 : 0;

  stateA.textContent = a;
  stateB.textContent = b;

  const results = {
    and: gates.AND(a, b),
    or: gates.OR(a, b),
    nand: gates.NAND(a, b),
    nor: gates.NOR(a, b),
    xor: gates.XOR(a, b),
    not: gates.NOT(a)
  };

  Object.entries(results).forEach(([key, value]) => {
    outputs[key].textContent = value;
    outputs[key].setAttribute('data-state', value);
    outputs[key].title = gateDescriptions[key.toUpperCase()];
  });
}

function parseSequence(value) {
  return value
    .split(',')
    .map((raw) => raw.trim().toUpperCase())
    .filter(Boolean);
}

function simulateChain(sequence, inputs) {
  const steps = [];
  let current = {
    label: 'Initial Inputs',
    A: Number(inputs[0]) || 0,
    B: Number(inputs[1]) || 0
  };
  steps.push({ ...current });

  sequence.forEach((gate, index) => {
    if (!(gate in gates)) {
      throw new Error(`Unknown gate "${gate}" at position ${index + 1}.`);
    }

    if (gate === 'NOT') {
      const next = gates.NOT(current.A);
      current = { label: `NOT(${current.A})`, A: next, B: current.B };
    } else {
      const out = gates[gate](current.A, current.B);
      current = { label: `${gate}(${current.A}, ${current.B})`, A: out, B: out };
    }

    steps.push({ ...current, gate });
  });

  return steps;
}

function renderBuilderOutput(steps) {
  const lines = steps.map((step, index) => {
    if (index === 0) {
      return `Step 0 – ${step.label}: A=${step.A}, B=${step.B}`;
    }
    return `Step ${index} – ${step.gate}: ${step.label} ⇒ A=${step.A}, B=${step.B}`;
  });
  return lines.join('\n');
}

function setTheme(isDark) {
  document.body.dataset.theme = isDark ? 'dark' : 'light';
  toggleTheme.textContent = isDark ? '🌙' : '☀️';
}

function bootstrapTheme() {
  const stored = localStorage.getItem('logic-gate-theme');
  if (stored) {
    setTheme(stored === 'dark');
  } else {
    setTheme(prefersDark);
  }
}

renderTruthTable();
bootstrapTheme();
updateVisualizer();

inputA.addEventListener('change', updateVisualizer);
inputB.addEventListener('change', updateVisualizer);

toggleTheme.addEventListener('click', () => {
  const isDark = document.body.dataset.theme !== 'dark';
  setTheme(isDark);
  localStorage.setItem('logic-gate-theme', isDark ? 'dark' : 'light');
});

builderForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const sequence = parseSequence(gateSequenceField.value);
  const inputs = initialInputsField.value.trim() || '00';

  try {
    const steps = simulateChain(sequence, inputs);
    builderOutput.textContent = renderBuilderOutput(steps);
  } catch (error) {
    builderOutput.textContent = error.message;
  }
});
