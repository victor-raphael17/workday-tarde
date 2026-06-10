import { describe, it, expect, beforeEach } from 'vitest';
import {
  statusBadge,
  placeholder,
  renderTableRows,
  renderTableState,
  toast,
  openForm,
} from './ui.js';

describe('statusBadge', () => {
  it('in status', () => {
    expect(statusBadge('in', 'Available')).toContain('status-success');
  });

  it('out status', () => {
    expect(statusBadge('out', 'Unavailable')).toContain('status-danger');
  });
});

describe('placeholder', () => {
  it('default', () => {
    expect(placeholder('Nenhum dado')).toContain('Nenhum dado');
  });

  it('error', () => {
    expect(placeholder('Erro', 'error')).toContain('text-danger');
  });

  it('default class', () => {
    expect(placeholder('Teste')).toContain('text-body-secondary');
  });
});

describe('table helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = '<table><tbody></tbody></table>';
  });

  it('renderiza linhas de tabela', () => {
    const tbody = document.querySelector('tbody');

    renderTableRows(tbody, ['A', 'B'], {
      colspan: 2,
      emptyMessage: 'Vazio',
      renderRow: (value) => `<tr><td>${value}</td></tr>`,
    });

    expect(tbody.querySelectorAll('tr')).toHaveLength(2);
    expect(tbody.textContent).toContain('A');
    expect(tbody.textContent).toContain('B');
  });

  it('renderiza estado vazio com colspan', () => {
    const tbody = document.querySelector('tbody');

    renderTableRows(tbody, [], {
      colspan: 3,
      emptyMessage: 'Sem dados',
      renderRow: (value) => `<tr><td>${value}</td></tr>`,
    });

    expect(tbody.querySelector('td').getAttribute('colspan')).toBe('3');
    expect(tbody.textContent).toContain('Sem dados');
  });

  it('renderiza estado de erro', () => {
    const tbody = document.querySelector('tbody');

    renderTableState(tbody, 'Falhou', { colspan: 4, tone: 'error' });

    expect(tbody.querySelector('td').getAttribute('colspan')).toBe('4');
    expect(tbody.querySelector('.text-danger')).not.toBeNull();
    expect(tbody.textContent).toContain('Falhou');
  });
});

describe('toast', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('cria container', () => {
    toast('Teste');

    expect(document.querySelector('.toast-host')).not.toBeNull();
  });
});

describe('openForm', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('abre modal', () => {
    openForm({
      title: 'Medicamento',
      fields: [],
    });

    expect(document.querySelector('.modal-card')).not.toBeNull();
  });

  it('cancelar retorna null', async () => {
    const promise = openForm({
      title: 'Teste',
      fields: [],
    });

    document.querySelector('[data-cancel]').click();

    const result = await promise;

    expect(result).toBeNull();
  });

  it('submit retorna dados', async () => {
    const promise = openForm({
      title: 'Teste',
      fields: [
        {
          name: 'nome',
          label: 'Nome',
        },
      ],
    });

    const input = document.querySelector('#f_nome');

    input.value = 'João';

    document.querySelector("button[type='submit']").click();

    const result = await promise;

    expect(result.nome).toBe('João');
  });
});
