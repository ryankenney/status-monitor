
it('Demonstrate leaked exception', () => {
	throw new Error("Dummy exception");
});

it('Demonstrate failed assertion', () => {
	expect(10).toEqual(9);
});

it('Demonstrate sucessful test', () => {
});
