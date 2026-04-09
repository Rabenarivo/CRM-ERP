export const DEPARTMENT_SCORES = {
  Direction: 100,
  Finance: 80,
  RH: 70,
  Commercial: 90,
  IT: 50,
  Magasiner: 10,
};

export const getUserDepartmentScore = (user) => {
  const departmentName = user?.department?.nom;
  const backendScore = Number(user?.department?.scores);

  if (Number.isFinite(backendScore) && backendScore >= 0) {
    return backendScore;
  }

  if (!departmentName) {
    return 0;
  }

  return DEPARTMENT_SCORES[departmentName] ?? 0;
};
