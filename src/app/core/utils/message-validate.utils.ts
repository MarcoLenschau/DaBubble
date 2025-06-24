export function validateEmail(email: string): Boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateError(element: any, action = "add"): void {
  if (action === "add") {
    element.inputRef.nativeElement.classList.add('error');
  } else {
    element.inputRef.nativeElement.classList.remove('error');
  }
}