'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LogAuditoria extends Model {
    static associate(models) {
      LogAuditoria.belongsTo(models.Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
    }
  }

  LogAuditoria.init({
    id_log: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'usuarios', key: 'id_usuario' },
    },
    acao: {
      type: DataTypes.STRING(50),
      allowNull: false,
      // Exemplos: 'CRIAR', 'EDITAR', 'CANCELAR', 'FECHAR', 'EXCLUIR'
    },
    entidade: {
      type: DataTypes.STRING(50),
      allowNull: false,
      // Tabela afetada: 'ordens_servico', 'vendas', 'produtos', etc.
    },
    id_registro: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // ID do registro afetado dentro da entidade
    },
    dados_anteriores: {
      type: DataTypes.JSON,
      allowNull: true,
      // Estado do registro ANTES da ação (útil em edições e cancelamentos)
    },
    dados_posteriores: {
      type: DataTypes.JSON,
      allowNull: true,
      // Estado do registro DEPOIS da ação
    },
    data_hora: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    ip_origem: {
      type: DataTypes.STRING(45),
      allowNull: true,
      // IPv4 ou IPv6 de onde veio a requisição
    },
  }, {
    sequelize,
    modelName: 'LogAuditoria',
    tableName: 'logs_auditoria',
    timestamps: false,
  });

  return LogAuditoria;
};
