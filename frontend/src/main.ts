import './style.css';

type IntegrationState = 'foundation' | 'connected';

interface RuntimeStatus {
  state: IntegrationState;
  description: string;
}

// The foundation deliberately does not fetch or fabricate forecast/user inputs.
// B-02 will replace this state with typed API-backed renderers.
const runtime: RuntimeStatus = {
  state: 'foundation',
  description: 'TypeScript interface initialized. Python API and live forecast integration are pending.',
};

const statusElement = document.querySelector<HTMLElement>('#runtime-status');
if (!statusElement) {
  throw new Error('UnlockPlan runtime status element is missing from index.html');
}
statusElement.textContent = runtime.description;
statusElement.dataset.state = runtime.state;
document.documentElement.dataset.runtime = runtime.state;
