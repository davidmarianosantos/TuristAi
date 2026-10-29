import type { Categoria } from "@/data/tipos";

/**
 * Atividades que a Lei nº 11.771/2008 obriga a ter Cadastur: hospedagem, agências de turismo,
 * guias e transporte turístico (também eventos e parques, que não temos como categoria).
 * Restaurante, barraca, loja e vida noturna podem se cadastrar, mas não são obrigados:
 * para eles o selo "Cadastur verificado" não aparece.
 */
export const CADASTUR_OBRIGATORIO: Categoria[] = ["hotel", "pousada", "receptivo", "condutor", "transporte"];

export const mostraCadastur = (e: { categoria: Categoria; cadastur: boolean }) => e.cadastur && CADASTUR_OBRIGATORIO.includes(e.categoria);
