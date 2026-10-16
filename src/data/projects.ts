export type ProjectId =
  'celerity' | 'venae-machinae' | 'deburr' | 'chief' | 'sup' | 'skills';

export type Project = {
  id: ProjectId;
  number: string;
  repo: string;
  lang: string;
  object: string;
  spec: string;
  description: string;
  url: string;
};

export const projects: readonly Project[] = [
  {
    id: 'celerity',
    number: '01',
    repo: 'celerity',
    lang: 'Rust',
    object: 'Rotary engine on a stand',
    spec: '13B twin rotor · CAN',
    description:
      'Vehicle-control runtime and duct-controller firmware for my FD RX-7.',
    url: 'https://github.com/kellen-miller/celerity',
  },
  {
    id: 'venae-machinae',
    number: '02',
    repo: 'venae-machinae',
    lang: 'TypeScript',
    object: 'Harness board',
    spec: 'harness + fluid · no CAD',
    description:
      'Wiring and fluid-system design for hobby car builds, without the CAD overhead.',
    url: 'https://github.com/kellen-miller/venae-machinae',
  },
  {
    id: 'deburr',
    number: '03',
    repo: 'deburr',
    lang: 'Go',
    object: 'Bench grinder',
    spec: 'Go + TS · no models',
    description:
      'Deterministic reports that find the rough edges in Go and TypeScript code.',
    url: 'https://github.com/kellen-miller/deburr',
  },
  {
    id: 'chief',
    number: '04',
    repo: 'chief',
    lang: 'TypeScript',
    object: 'Pit radio',
    spec: 'discord · voice · sqlite',
    description:
      'A Discord chief of staff for a friends server, with voice, memory and a monthly budget.',
    url: 'https://github.com/kellen-miller/chief',
  },
  {
    id: 'sup',
    number: '05',
    repo: 'sup',
    lang: 'Python',
    object: 'Tool chest',
    spec: 'yaml jobs · rich TUI',
    description:
      'One command that runs every local update job behind a live terminal dashboard.',
    url: 'https://github.com/kellen-miller/sup',
  },
  {
    id: 'skills',
    number: '06',
    repo: 'skills',
    lang: 'Python',
    object: 'Pegboard',
    spec: '~/.agents/skills',
    description:
      'My agent skills, versioned and synced to every coding agent on the machine.',
    url: 'https://github.com/kellen-miller/skills',
  },
];
