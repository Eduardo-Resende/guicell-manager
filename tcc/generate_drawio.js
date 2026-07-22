const fs = require('fs');

const tables = [
  { name: 'clientes', x: 40, y: 40, fields: ['id_cliente PK', 'nome', 'cpf_cnpj UNIQUE', 'telefone', 'email', 'endereco', 'criado_em'] },
  { name: 'aparelhos', x: 300, y: 40, fields: ['id_aparelho PK', 'id_cliente FK', 'marca', 'modelo', 'imei UNIQUE', 'observacoes'] },
  { name: 'usuarios', x: 820, y: 40, fields: ['id_usuario PK', 'nome', 'login UNIQUE', 'senha_hash', 'perfil', 'ativo', 'criado_em'] },
  { name: 'ordens_servico', x: 300, y: 340, fields: ['id_os PK', 'numero_os UNIQUE', 'id_cliente FK', 'id_aparelho FK', 'id_tecnico FK', 'defeito_relatado', 'diagnostico', 'status', 'valor_orcado', 'valor_final', 'forma_pagamento', 'data_abertura', 'data_fechamento', 'prazo_estimado'] },
  { name: 'produtos', x: 820, y: 340, fields: ['id_produto PK', 'descricao', 'categoria', 'estoque_atual', 'estoque_minimo', 'valor_custo', 'valor_venda'] },
  { name: 'itens_os', x: 560, y: 340, fields: ['id_item_os PK', 'id_os FK', 'id_produto FK', 'quantidade', 'valor_unitario'] },
  { name: 'vendas', x: 40, y: 700, fields: ['id_venda PK', 'id_cliente FK (opt)', 'id_usuario FK', 'data_venda', 'valor_total', 'forma_pagamento', 'desconto'] },
  { name: 'itens_venda', x: 560, y: 700, fields: ['id_item_venda PK', 'id_venda FK', 'id_produto FK', 'quantidade', 'valor_unitario'] },
  { name: 'caixa', x: 300, y: 920, fields: ['id_caixa PK', 'id_usuario FK', 'data', 'tipo', 'valor', 'descricao', 'categoria', 'id_os FK (opt)', 'id_venda FK (opt)'] }
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="Electron" modified="2023-10-27T00:00:00.000Z" agent="Mozilla/5.0" version="22.0.8" type="device">
  <diagram id="erd" name="ERD">
    <mxGraphModel dx="1434" dy="836" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />`;

let idCounter = 2;
const tableIds = {};

tables.forEach(table => {
  const tableId = idCounter++;
  tableIds[table.name] = tableId;
  xml += `
        <mxCell id="${tableId}" value="${table.name}" style="shape=table;startSize=30;container=1;collapsible=0;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;align=center;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="${table.x}" y="${table.y}" width="220" height="${30 + table.fields.length * 30}" as="geometry" />
        </mxCell>`;
  
  table.fields.forEach((field, i) => {
    const rowId = idCounter++;
    xml += `
        <mxCell id="${rowId}" value="" style="shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;top=0;left=0;bottom=0;right=0;collapsible=0;dropTarget=0;fillColor=none;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="${tableId}">
          <mxGeometry y="${30 + i * 30}" width="220" height="30" as="geometry" />
        </mxCell>`;
    const cellId = idCounter++;
    let icon = '';
    let bold = '';
    if (field.includes('PK')) { icon = '🔑 '; bold = 'fontStyle=1;'; }
    else if (field.includes('FK')) { icon = '🔗 '; }
    
    // Simple colors per type to match request:
    // Regular is white (default), PK is yellow, FK is pink
    let fillColor = 'none';
    if (field.includes('PK')) fillColor = '#fff2cc'; // yellow
    if (field.includes('FK')) fillColor = '#f8cecc'; // pink

    xml += `
        <mxCell id="${cellId}" value="${icon}${field}" style="shape=partialRectangle;html=1;whiteSpace=wrap;connectable=0;fillColor=${fillColor};top=0;left=0;bottom=0;right=0;overflow=hidden;align=left;spacingLeft=6;${bold}" vertex="1" parent="${rowId}">
          <mxGeometry width="220" height="30" as="geometry" />
        </mxCell>`;
  });
});

const relations = [
  { source: 'clientes', target: 'aparelhos', label: 'possui', style: 'endArrow=ERmany;startArrow=ERone;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;' },
  { source: 'clientes', target: 'ordens_servico', label: 'tem', style: 'endArrow=ERmany;startArrow=ERone;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;' },
  { source: 'clientes', target: 'vendas', label: 'realiza (opcional)', style: 'endArrow=ERmany;startArrow=ERzeroToOne;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;dashed=1;' },
  { source: 'aparelhos', target: 'ordens_servico', label: 'de', style: 'endArrow=ERmany;startArrow=ERone;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;' },
  { source: 'usuarios', target: 'ordens_servico', label: 'executa', style: 'endArrow=ERmany;startArrow=ERone;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;' },
  { source: 'usuarios', target: 'vendas', label: 'registra', style: 'endArrow=ERmany;startArrow=ERone;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;' },
  { source: 'usuarios', target: 'caixa', label: 'lanca', style: 'endArrow=ERmany;startArrow=ERone;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;' },
  { source: 'ordens_servico', target: 'itens_os', label: 'contem', style: 'endArrow=ERmany;startArrow=ERone;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;' },
  { source: 'ordens_servico', target: 'caixa', label: 'gera', style: 'endArrow=ERzeroToOne;startArrow=ERone;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;dashed=1;' },
  { source: 'produtos', target: 'itens_os', label: 'em', style: 'endArrow=ERmany;startArrow=ERone;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;' },
  { source: 'vendas', target: 'itens_venda', label: 'contem', style: 'endArrow=ERmany;startArrow=ERone;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;' },
  { source: 'vendas', target: 'caixa', label: 'gera', style: 'endArrow=ERzeroToOne;startArrow=ERone;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;dashed=1;' },
  { source: 'produtos', target: 'itens_venda', label: 'em', style: 'endArrow=ERmany;startArrow=ERone;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;' },
];

relations.forEach(rel => {
  const edgeId = idCounter++;
  const sourceId = tableIds[rel.source];
  const targetId = tableIds[rel.target];
  
  xml += `
        <mxCell id="${edgeId}" value="${rel.label}" style="${rel.style}" edge="1" parent="1" source="${sourceId}" target="${targetId}">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint as="sourcePoint" />
            <mxPoint as="targetPoint" />
          </mxGeometry>
        </mxCell>`;
});

// Add Footer
xml += `
        <mxCell id="${idCounter++}" value="Fonte: Elaborado pelos autores (2026)" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;" vertex="1" parent="1">
          <mxGeometry x="400" y="1050" width="300" height="30" as="geometry" />
        </mxCell>`;

xml += `
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

fs.writeFileSync('c:\\Users\\Eduardo\\Documents\\Estudo\\faculdade\\tcc\\diagrama4_DER_guicell.drawio', xml);
console.log('Diagrama Draw.io gerado com sucesso!');
