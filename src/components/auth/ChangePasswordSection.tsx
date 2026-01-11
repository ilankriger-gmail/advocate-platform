'use client';

import { useState } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { updatePassword } from '@/actions/auth';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

/**
 * Secao de alteracao de senha para a pagina de perfil
 * Exige senha atual para maior seguranca
 */
export default function ChangePasswordSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    if (!formData.currentPassword || !formData.password || !formData.confirmPassword) {
      setError('Preencha todos os campos');
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas nao coincidem');
      setIsSubmitting(false);
      return;
    }

    const data = new FormData();
    data.append('currentPassword', formData.currentPassword);
    data.append('password', formData.password);
    data.append('confirmPassword', formData.confirmPassword);

    try {
      const result = await updatePassword(data);

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setFormData({
        currentPassword: '',
        password: '',
        confirmPassword: '',
      });
      setIsExpanded(false);
    } catch {
      setError('Erro ao atualizar senha');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setError('');
    setSuccess(false);
    setFormData({
      currentPassword: '',
      password: '',
      confirmPassword: '',
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Seguranca
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Altere sua senha de acesso
          </p>
        </div>
        {!isExpanded && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsExpanded(true)}
          >
            Alterar senha
          </Button>
        )}
      </div>

      {/* Mensagem de sucesso */}
      {success && (
        <div className="p-4 bg-green-50 text-green-600 rounded-lg text-sm mb-4">
          Senha alterada com sucesso!
        </div>
      )}

      {isExpanded && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Senha atual"
            name="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={handleChange}
            placeholder="Digite sua senha atual"
            required
          />

          <Input
            label="Nova senha"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Digite sua nova senha"
            required
          />

          {/* Indicador de forca da senha */}
          <PasswordStrengthIndicator password={formData.password} />

          <Input
            label="Confirmar nova senha"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirme sua nova senha"
            required
          />

          {/* Erro */}
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !formData.currentPassword || !formData.password || !formData.confirmPassword}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar nova senha'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
