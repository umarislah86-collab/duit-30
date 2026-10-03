const fs=require('fs'),vm=require('vm'),assert=require('assert');
const context={Intl,Date,categoryLabel:x=>x};vm.createContext(context);vm.runInContext(fs.readFileSync('src/dynamic_analysis.js','utf8'),context);
const row=(date,type,amount,category,name)=>({date,type,amount:type==='Income'?amount:-amount,category,name,account:'Bank',notes:''});
const rows=[];for(let m=1;m<=6;m++){const date=`2026-${String(m).padStart(2,'0')}-01`;rows.push(row(date,'Income',3000,'Salary','Gaji DXC'),row(date,'Expense',1000,'Dining Out','Meals'),row(date,'Expense',1000,'Medical','Care'),row(date,'Transfer',800,'(Transfer)','Prima'));}
rows.push(row('2026-07-02','Expense',999999,'Dining Out','Current month'),row('2030-01-01','Expense',999999,'Dining Out','Future'));
let a=context.analyseSpending(rows,'month','','2026-07-03');assert.equal(a.n,6);assert.equal(a.expense,2000);assert.equal(a.target,600);assert.equal(a.plannedCut,600);assert.equal(a.payday,400);assert.equal(a.categories.find(c=>c.category==='Medical').cut,0);assert.equal(a.future,1);
const essential=rows.filter(r=>r.category!=='Dining Out');a=context.analyseSpending(essential,'month','','2026-07-03');assert.equal(a.plannedCut,0);assert.equal(a.shortfall,a.target);
const debt=rows.map(r=>r.category==='Dining Out'?{...r,name:'Spaylater instalment'}:r);assert.equal(context.analyseSpending(debt,'month','','2026-07-03').plannedCut,0);
const cycles=['2026-01-05','2026-02-03','2026-03-08','2026-04-04','2026-05-09','2026-06-02','2026-07-01'].flatMap(date=>[row(date,'Income',3000,'Salary','Gaji DXC'),row(date,'Expense',100,'Dining Out','Meals')]);a=context.analyseSpending(cycles,'salary','gaji dxc','2026-07-03');assert.equal(a.n,6);assert.equal(a.recent[0].start,'2026-01-05');assert.equal(a.recent.at(-1).end,'2026-07-01');assert.equal(a.expense,100);
assert.equal(context.analyseSpending([row('2026-07-02','Expense',100,'Dining Out','Meals')],'month','','2026-07-03').n,0);
const changed=rows.map(r=>r.category==='Medical'?{...r,amount:-2000}:r);assert.equal(context.analyseSpending(changed,'month','','2026-07-03').expense,3000);
console.log('PASS: independent budget fixtures, protected expenses, instalments, insufficient cut capacity, incomplete/future exclusions, irregular salary cycles and data-driven recalculation');

a=context.analyseSpending(rows,'month','','2026-07-03','2026-04',3);assert.equal(a.n,3);assert.equal(a.recent[0].start,'2026-01-01');assert.equal(a.recent.at(-1).end,'2026-04-01');assert(!a.data.some(x=>x.date>='2026-04-01'));
a=context.analyseSpending(cycles,'salary','gaji dxc','2026-07-03','2026-05-09',3);assert.equal(a.n,3);assert.equal(a.recent[0].start,'2026-02-03');assert.equal(a.recent.at(-1).end,'2026-05-09');
console.log('PASS: selected month and irregular salary cycle anchor the previous 3/6 periods; selected period excluded');
