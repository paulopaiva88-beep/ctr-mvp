import Link from "next/link";
import { StudentForm } from "../../../../components/student-form";

export default function NovoAlunoPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link
          href="/painel/alunos"
          className="text-sm font-semibold text-moss hover:underline"
        >
          ← Voltar
        </Link>
        <h1 className="mt-2 font-display text-3xl uppercase tracking-wide text-pine">
          Novo aluno
        </h1>
        <p className="mt-1 text-sm text-muted">
          Cada aluno pode ter um valor mensal diferente.
        </p>
      </div>
      <div className="panel-shell p-4 shadow-soft sm:p-6">
        <StudentForm mode="create" />
      </div>
    </div>
  );
}
