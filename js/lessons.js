// Lesson content.
//
// Prose fields are HTML. Inside prose, {{like this}} becomes inline <code>
// (and is HTML-escaped, so {{Box<T>}} is safe to write).
// Code fields are plain C# and are highlighted by highlight.js.
//
// Fields per lesson:
//   title, intro, code: [{ label?, src }], diagram, changed, why,
//   predict: [{ q, a }], before, full (complete code so far), extra: [{ summary, html }],
//   widget: { type: "walker" | "loop", ... }

(function () {

  // ---------- "complete code so far" snapshots ----------

  var FULL_CONCRETE = `
public class MyNumbers
{
    private readonly int[] _items = { 10, 20, 30 };

    public int Count => _items.Length;
    public int this[int index] => _items[index];

    public NumberWalker GetWalker()
    {
        return new NumberWalker(this);
    }
}

public class NumberWalker
{
    private readonly MyNumbers _numbers;
    private int _position = -1;

    public NumberWalker(MyNumbers numbers)
    {
        _numbers = numbers;
    }

    public bool MoveNext()
    {
        _position++;
        return _position < _numbers.Count;
    }

    public int Current => _numbers[_position];
}`;

  var FULL_WALKER_INTERFACE = `
public interface IMyEnumerator<T>
{
    bool MoveNext();
    T Current { get; }
}

public class MyNumbers
{
    private readonly int[] _items = { 10, 20, 30 };

    public int Count => _items.Length;
    public int this[int index] => _items[index];

    public NumberWalker GetWalker()
    {
        return new NumberWalker(this);
    }
}

public class NumberWalker : IMyEnumerator<int>
{
    private readonly MyNumbers _numbers;
    private int _position = -1;

    public NumberWalker(MyNumbers numbers)
    {
        _numbers = numbers;
    }

    public bool MoveNext()
    {
        _position++;
        return _position < _numbers.Count;
    }

    public int Current => _numbers[_position];
}`;

  var FULL_BOTH_INTERFACES = `
public interface IMyEnumerable<T>
{
    IMyEnumerator<T> GetEnumerator();
}

public interface IMyEnumerator<T>
{
    bool MoveNext();
    T Current { get; }
}

public class MyNumbers : IMyEnumerable<int>
{
    private readonly int[] _items = { 10, 20, 30 };

    public int Count => _items.Length;
    public int this[int index] => _items[index];

    public IMyEnumerator<int> GetEnumerator()
    {
        return new NumberWalker(this);
    }
}

public class NumberWalker : IMyEnumerator<int>
{
    private readonly MyNumbers _numbers;
    private int _position = -1;

    public NumberWalker(MyNumbers numbers)
    {
        _numbers = numbers;
    }

    public bool MoveNext()
    {
        _position++;
        return _position < _numbers.Count;
    }

    public int Current => _numbers[_position];
}`;

  var FULL_REAL = `
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

var numbers = new MyNumbers();

foreach (var n in numbers)
    Console.WriteLine(n);

Console.WriteLine(numbers.Sum());   // LINQ works too: it only needs IEnumerable<int>

public class MyNumbers : IEnumerable<int>
{
    private readonly int[] _items = { 10, 20, 30 };

    public int Count => _items.Length;
    public int this[int index] => _items[index];

    public IEnumerator<int> GetEnumerator()
    {
        return new NumberWalker(this);
    }

    // Plumbing: the non-generic IEnumerable that IEnumerable<T> inherits
    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}

public class NumberWalker : IEnumerator<int>
{
    private readonly MyNumbers _numbers;
    private int _position = -1;

    public NumberWalker(MyNumbers numbers)
    {
        _numbers = numbers;
    }

    public bool MoveNext()
    {
        _position++;
        return _position < _numbers.Count;
    }

    public int Current => _numbers[_position];

    // Plumbing: non-generic IEnumerator + IDisposable
    object IEnumerator.Current => Current;
    public void Reset() => _position = -1;
    public void Dispose() { }
}`;

  // ---------- lessons ----------

  window.LESSONS = [

    // 0 — overview: objective, destination code, the confusion, the plan
    {
      title: "Where we're going",
      eyebrow: "Start here",
      intro: `<p><strong>The objective:</strong> understand {{IEnumerable<T>}} and {{IEnumerator<T>}} well enough that you could have designed them yourself — and, more importantly, see how C# framework abstractions in general are assembled from a few small ideas: generics, interfaces, composition, and one object handing you another.</p>`,
      codeTitle: "This is the code we'll end up with",
      code: [{ src: `
public class MyNumbers : IEnumerable<int>
{
    private readonly int[] _items = { 10, 20, 30 };

    public int Count => _items.Length;
    public int this[int index] => _items[index];

    public IEnumerator<int> GetEnumerator() => new NumberWalker(this);
}

public class NumberWalker : IEnumerator<int>
{
    private readonly MyNumbers _numbers;
    private int _position = -1;

    public NumberWalker(MyNumbers numbers) => _numbers = numbers;

    public bool MoveNext()
    {
        _position++;
        return _position < _numbers.Count;
    }

    public int Current => _numbers[_position];

    // (a little framework plumbing omitted — we'll see it in step 15)
}` }, { label: "so that this works", src: `
foreach (var n in new MyNumbers())
{
    Console.WriteLine(n);
}` }],
      sections: [
        { title: "This is the confusion", html: `
<p>You've used {{foreach}} and {{IEnumerable<T>}} for years. But read that code cold and the questions pile up:</p>
<ul>
<li>Why are there <em>two</em> interfaces? Why isn't a collection just walkable by itself? <a href="#9">→ step 9</a></li>
<li>Why does {{GetEnumerator()}} return a <em>different object</em> instead of the collection doing the work? <a href="#8">→ step 8</a>, <a href="#11">step 11</a></li>
<li>Why does {{_position}} start at {{-1}}? <a href="#10">→ step 10</a></li>
<li>Why is {{MoveNext()}} a {{bool}} method and {{Current}} a property? <a href="#10">→ step 10</a></li>
<li>What does {{<T>}} buy us, and why is {{MyNumbers}} not generic when {{IEnumerable<T>}} is? <a href="#4">→ step 4</a>, <a href="#7">step 7</a></li>
<li>Where did {{GetEnumerator()}}, {{MoveNext()}} and {{Current}} go in the {{foreach}}? <a href="#16">→ step 16</a></li>
</ul>
<p>Each question has a simple answer. The confusion comes from seeing all the answers at once, already assembled.</p>` },
        { title: "Let's break it down", html: `
<p>Instead of explaining the finished thing top-down, we'll build it bottom-up. Each step adds one small idea to the previous one, until the code above appears on its own.</p>` }
      ],
      diagram: `
Part 1  Generics                 steps 2–5     Box  →  Box<T>
Part 2  Contracts                steps 6–8     IBox<T>, one interface returns another
Part 3  Walking                  steps 9–11    MyNumbers + NumberWalker (all concrete)
Part 4  Contracts for walking    steps 12–14   IMyEnumerator<T>, IMyEnumerable<T>
Part 5  The reveal               steps 15–16   IEnumerable<T>, IEnumerator<T>, foreach
Part 6  Zoom out                 steps 17–19   the pattern, the mental model, summary`,
      diagramTitle: "The route",
      before: `<p>You don't need to understand the code above yet. Keep it in the back of your mind — by step 16 every line of it will be something you wrote for a reason. Press <strong>Next</strong> to start with the simplest class possible.</p>`
    },

    // 1
    {
      title: "A plain concrete class",
      intro: `<p>We start with the most boring type possible. Everything later in this tutorial is built by changing this one class a little at a time.</p>`,
      code: [{ src: `
public class Box
{
    public int Value { get; set; }
}` }, { label: "usage", src: `
var box = new Box();
box.Value = 42;

int n = box.Value;` }],
      diagram: `
Box
 └── Value : int     ← decided by whoever wrote Box`,
      changed: `<p>Nothing yet. One class, one property, one fixed type.</p>`,
      why: `<p>We need a baseline. The important detail is <em>who</em> chose {{int}}: the author of {{Box}}, when the class was written. The caller has no say.</p>`,
      predict: [
        { q: "Who decides the type of {{Value}}: the author of {{Box}} or the code that uses it?",
          a: "The author. The type is baked into the class definition. Keep this in mind; the next two steps are about moving that decision to the caller." }
      ],
      before: `<p>A concrete type fixes every member type at the point it is written.</p>`
    },

    // 2
    {
      title: "Why this is limited",
      intro: `<p>Now suppose you want the same idea — “a thing that holds one value” — for {{string}}, {{Customer}} and {{DateTime}}. There are two obvious workarounds. Both are bad.</p>`,
      code: [{ label: "workaround 1: copy the class per type", src: `
public class IntBox      { public int      Value { get; set; } }
public class StringBox   { public string   Value { get; set; } }
public class CustomerBox { public Customer Value { get; set; } }
public class DateBox     { public DateTime Value { get; set; } }` },
      { label: "workaround 2: use object", src: `
public class ObjectBox
{
    public object Value { get; set; }
}

var box = new ObjectBox { Value = "hello" };
int n = (int)box.Value;   // compiles fine, throws InvalidCastException at runtime` }],
      diagram: `
same shape, different type:

IntBox       StringBox      CustomerBox     DateBox
 └ int        └ string       └ Customer      └ DateTime

      "The logic is identical. Only the type varies."`,
      changed: `<p>Nothing was added. We are staring at a problem.</p>`,
      why: `<p>Copying scales linearly with the number of types and every fix has to be made N times. {{object}} avoids copying but throws away what the compiler knew: every read needs a cast, mistakes move from compile time to runtime, and value types get boxed onto the heap.</p>
<p>What we actually want: <strong>write the class once, and let the caller say which type goes in the hole.</strong></p>`,
      predict: [
        { q: "{{ObjectBox}} removes the duplication. What exactly does it cost?",
          a: "Type safety (casts are checked only at runtime), intent (the signature no longer says what's inside), and for value types an allocation per assignment because of boxing." }
      ],
      before: `<p>The problem is not “storing a value”. It's that the <em>type</em> is decided in the wrong place.</p>`
    },

    // 3
    {
      title: "Box becomes Box<T>",
      intro: `<p>Replace the fixed type with a placeholder. By convention the placeholder is called {{T}}.</p>`,
      code: [{ src: `
public class Box<T>
{
    public T Value { get; set; }
}` }, { label: "usage", src: `
var a = new Box<int>    { Value = 42 };
var b = new Box<string> { Value = "hello" };

int n    = a.Value;      // no cast
string s = b.Value;      // no cast

// a.Value = "oops";     // compile error: cannot convert string to int` }],
      diagram: `
Box<T>                  written once; T is a hole
 │
 ├── Box<int>           caller fills the hole with int
 ├── Box<string>        caller fills the hole with string
 └── Box<Customer>      caller fills the hole with Customer`,
      changed: `<p>{{int}} became {{T}}, and the class name gained {{<T>}}.</p>`,
      why: `<p>{{T}} means: <strong>the caller supplies the type later.</strong> The author writes the logic once; the caller picks the type at the point of use. The compiler then treats {{Box<int>}} as if you had written {{IntBox}} by hand — full type checking, no casts, no boxing.</p>`,
      predict: [
        { q: "In {{var c = new Box<DateTime>();}} what is {{T}}?",
          a: "{{DateTime}}. The caller chose it by writing it in the angle brackets." },
        { q: "Are {{Box<int>}} and {{Box<string>}} the same type?",
          a: "No. {{Box<T>}} is an <em>open</em> generic definition. {{Box<int>}} and {{Box<string>}} are two distinct <em>closed</em> types. You can't assign one to the other." }
      ],
      before: `<p>Generics move the type decision from the author to the caller, without losing compile-time checking.</p>`
    },

    // 4
    {
      title: "A method that returns T",
      intro: `<p>{{T}} isn't limited to property types. Anywhere you'd write a type inside the class, you can write {{T}}.</p>`,
      code: [{ src: `
public class Box<T>
{
    private T _value;                 // T as a field type

    public Box(T value)               // T as a parameter type
    {
        _value = value;
    }

    public T GetValue()               // T as a return type
    {
        return _value;
    }
}` }, { label: "usage", src: `
var box = new Box<string>("hello");
string s = box.GetValue();` }],
      diagram: `
Box<string>
 ├── _value     : string
 ├── Box(string value)
 └── GetValue() : string

(every T above was replaced by string)`,
      changed: `<p>The public settable property became a private field, a constructor, and a {{GetValue()}} method.</p>`,
      why: `<p>A method turns “give me the value” into an <em>operation</em>. Contracts — which are next — are described in terms of operations. It also means the box is free to decide <em>how</em> it produces the value.</p>`,
      predict: [
        { q: "For a {{Box<Customer>}}, what is the return type of {{GetValue()}}?",
          a: "{{Customer}}. Every {{T}} in the class is substituted with the type the caller chose." }
      ],
      before: `<p>{{T}} can appear in fields, properties, parameters and return types. Once the caller picks {{T}}, all of them agree.</p>`
    },

    // 5
    {
      title: "A generic interface",
      intro: `<p>Code that <em>uses</em> a box usually doesn't care how the value is stored. It just wants to ask for it. Let's write down only that capability.</p>`,
      code: [{ src: `
public interface IBox<T>
{
    T GetValue();
}` }],
      diagram: `
IBox<T>          the contract: "you can ask me for a T"
   ▲
   │ implements   (next step)
   │
  ???            some class that actually holds or produces a T`,
      changed: `<p>A new interface with one member. It has a type parameter, just like {{Box<T>}}.</p>`,
      why: `<p><strong>The interface is the contract. A concrete class supplies the implementation.</strong></p>
<p>Consumers can depend on {{IBox<T>}} and never mention a concrete class. The value could come from a field, a calculation, a cache, or a database — the consumer's code wouldn't change.</p>`,
      predict: [
        { q: "Can you write {{new IBox<int>()}}?",
          a: "No. An interface only describes members; it has no implementation to run. You need a class that implements it." }
      ],
      before: `<p>An interface can be generic too. {{IBox<T>}} means “for whatever {{T}} you choose, I can give you one.”</p>`
    },

    // 6
    {
      title: "Implementing the generic interface",
      intro: `<p>{{Box<T>}} already has a {{T GetValue()}} method, so it can declare that it satisfies the contract.</p>`,
      code: [{ src: `
public class Box<T> : IBox<T>
{
    private readonly T _value;

    public Box(T value) => _value = value;

    public T GetValue() => _value;
}` }, { label: "a second, different implementation of the same contract", src: `
public class LazyBox<T> : IBox<T>
{
    private readonly Func<T> _factory;

    public LazyBox(Func<T> factory) => _factory = factory;

    public T GetValue() => _factory();
}` }, { label: "a consumer that only knows the contract", src: `
void Print(IBox<string> box) => Console.WriteLine(box.GetValue());

Print(new Box<string>("stored"));
Print(new LazyBox<string>(() => "computed"));` }],
      diagram: `
                IBox<T>
               ▲       ▲
    implements │       │ implements
               │       │
          Box<T>       LazyBox<T>
       (stores a T)    (computes a T)

        Box<T> : IBox<T>
            └──────┘   the class's T is passed through to the interface's T`,
      changed: `<p>{{: IBox<T>}} on the class declaration, plus a second implementation.</p>`,
      why: `<p>{{Print}} depends only on the contract, so it works with both classes and with any future class. Notice the plumbing in {{Box<T> : IBox<T>}}: the class receives {{T}} from its caller and hands the same {{T}} to the interface.</p>`,
      predict: [
        { q: "Given {{class IntBox : IBox<int>}}, is {{IntBox}} generic?",
          a: "No. It <em>closes</em> the generic interface with {{int}}. A non-generic class can implement a generic interface by picking the type itself. We'll use exactly this trick later with {{MyNumbers : IMyEnumerable<int>}}." }
      ],
      before: `<p>A generic class can pass its {{T}} into a generic interface, or a normal class can fix {{T}} to a specific type. Either way, consumers see only the contract.</p>`
    },

    // 7
    {
      title: "One abstraction returns another",
      intro: `<p>This step is the hinge of the whole tutorial. So far, an interface method returned a plain value. Now we'll have an interface method return <em>another interface</em>.</p>`,
      code: [{ src: `
public interface IBoxProvider<T>
{
    IBox<T> GetBox();
}

public class GreetingProvider : IBoxProvider<string>
{
    public IBox<string> GetBox()
    {
        return new Box<string>("hello");
    }
}` }, { label: "usage", src: `
IBoxProvider<string> provider = new GreetingProvider();

IBox<string> box = provider.GetBox();   // an object hands us another object
string s = box.GetValue();` }],
      diagram: `
IBoxProvider<T>
     │
     │ GetBox()
     ▼
  IBox<T>
     │
     │ GetValue()
     ▼
     T`,
      changed: `<p>A second interface whose only job is to <em>produce</em> an {{IBox<T>}}.</p>`,
      why: `<p>The caller talks to two contracts and knows zero concrete types after construction. {{GreetingProvider}} could start returning a {{LazyBox<string>}} tomorrow and no caller would need to change.</p>
<p>This “give me a thing that does the work” shape is how a lot of the framework is built: factories, {{IServiceProvider}}, {{DbContext}} → {{DbSet}}, and — soon — collections and their enumerators.</p>`,
      predict: [
        { q: "What concrete type does the caller receive from {{GetBox()}}?",
          a: "It's a {{Box<string>}}, but the caller doesn't know and doesn't need to. It sees only {{IBox<string>}}." },
        { q: "Does {{GetBox()}} return the same box every time?",
          a: "Here, no — it creates a new one per call. Whether a method returns a fresh object or a shared one is a design decision. Hold onto that: it becomes crucial in step 11." }
      ],
      before: `<p>A method can return an abstraction. The caller gets <em>behaviour</em>, not a concrete class.</p>`
    },

    // 8
    {
      title: "The idea of a walker",
      intro: `<p>Let's set boxes aside and look at a collection. We want to go through its items one at a time. Everything stays concrete for now — no interfaces.</p>`,
      code: [{ src: `
public class MyNumbers
{
    private readonly int[] _items = { 10, 20, 30 };

    public int Count => _items.Length;
    public int this[int index] => _items[index];
}

public class NumberWalker
{
    // Job: remember a position inside a MyNumbers
    // and move through it. We build it next step.
}` }, { label: "the tempting alternative (don't)", src: `
public class MyNumbers
{
    private readonly int[] _items = { 10, 20, 30 };
    private int _position = -1;    // whose position is this?
}` }],
      diagram: `
MyNumbers                     NumberWalker
 └── [10] [20] [30]            └── "where am I?"

 owns the DATA                 owns the TRAVERSAL STATE`,
      changed: `<p>Two classes. One holds numbers. The other is an empty shell whose job is to remember a position.</p>`,
      why: `<p>Walking needs state: “where am I?” If that state lives in the collection, the collection can only be walked by one caller at a time. Putting it in a separate object means the position belongs to whoever is walking, not to the data.</p>`,
      predict: [
        { q: "If {{MyNumbers}} stored {{_position}} itself, what breaks when you write a nested loop over the same collection?",
          a: "The inner loop moves the shared position. When it finishes, the outer loop's position is at the end, so the outer loop stops after its first item. Two walkers can't share one bookmark." }
      ],
      before: `<p>Data and “where I am in the data” are different responsibilities, so they get different objects.</p>`
    },

    // 9
    {
      title: "Building the walker",
      intro: `<p>The walker needs three things: a reference to the numbers, a position, and two operations — move forward, and read what's here.</p>`,
      code: [{ src: `
public class NumberWalker
{
    private readonly MyNumbers _numbers;
    private int _position = -1;

    public NumberWalker(MyNumbers numbers)
    {
        _numbers = numbers;
    }

    public bool MoveNext()
    {
        _position++;
        return _position < _numbers.Count;
    }

    public int Current => _numbers[_position];
}` }],
      diagram: `
new NumberWalker(...)           _position = -1   (before start)

    [10]  [20]  [30]
  ^

MoveNext() → true               _position = 0    Current = 10

    [10]  [20]  [30]
     ^

MoveNext() → true               _position = 1    Current = 20

    [10]  [20]  [30]
           ^

MoveNext() → true               _position = 2    Current = 30

    [10]  [20]  [30]
                 ^

MoveNext() → false              _position = 3    (past the end)

    [10]  [20]  [30]
                       ^`,
      widget: { type: "walker", walkers: ["walker"] },
      changed: `<p>{{_position}}, {{MoveNext()}} and {{Current}}.</p>`,
      why: `<p>The protocol is always <strong>move, then read</strong>. {{MoveNext()}} does the moving <em>and</em> reports whether there's anything to read. {{Current}} just reads — calling it twice doesn't advance.</p>`,
      predict: [
        { q: "Why does {{_position}} start at {{-1}} instead of {{0}}?",
          a: "Because the protocol is “move, then read”. Starting before the first item means the very first {{MoveNext()}} lands on index 0. It also handles an empty collection for free: the first {{MoveNext()}} returns {{false}} and nobody ever reads {{Current}}." },
        { q: "What does {{MoveNext()}} return after the final item?",
          a: "{{false}}. Position goes from 2 to 3, and {{3 < 3}} is false. That's the signal to stop." },
        { q: "What happens if you read {{Current}} after {{MoveNext()}} returned {{false}}?",
          a: "In this implementation, {{IndexOutOfRangeException}}. For the real .NET interfaces, reading {{Current}} there is documented as undefined — don't do it." }
      ],
      before: `<p>A walker is just a small stateful object: a position plus “move” and “read”. Try the buttons above until the -1 start feels natural.</p>`
    },

    // 10
    {
      title: "The collection creates walkers",
      intro: `<p>Right now callers must write {{new NumberWalker(numbers)}} themselves. Instead, let the collection hand them one — just like {{IBoxProvider}} handed out boxes.</p>`,
      code: [{ label: "added to MyNumbers", src: `
public NumberWalker GetWalker()
{
    return new NumberWalker(this);
}` }, { label: "usage", src: `
var numbers = new MyNumbers();

var a = numbers.GetWalker();
var b = numbers.GetWalker();

a.MoveNext();
a.MoveNext();       // a is on 20

b.MoveNext();       // b is on 10 — unaffected by a` }],
      diagram: `
                MyNumbers  (owns 10, 20, 30)
                 │       │
     GetWalker() │       │ GetWalker()
                 ▼       ▼
            walker a    walker b
            pos = 1     pos = 0
            (on 20)     (on 10)`,
      widget: { type: "walker", walkers: ["a", "b"] },
      changed: `<p>{{MyNumbers}} gained {{GetWalker()}}, which returns a <em>new</em> walker every call.</p>`,
      why: `<p><strong>The collection owns the data. The walker owns the traversal state.</strong> The collection never needs to remember where any caller is. Each call to {{GetWalker()}} produces an independent bookmark, so any number of walks can happen at once — nested loops, two threads reading, a LINQ query inside a loop.</p>`,
      predict: [
        { q: "Why does {{GetWalker()}} create a new walker instead of returning one stored in a field?",
          a: "Because each walk needs private state. A stored walker would be a shared bookmark — the exact problem from step 9, just moved into a field." },
        { q: "What would happen if two callers shared the same walker?",
          a: "Every {{MoveNext()}} by one caller advances the other. With 10, 20, 30 and two callers alternating, one might see 10 and 30 and the other only 20. Neither sees the whole collection." }
      ],
      before: `<p>Try the two walkers above: move one, and watch the other stay put. That independence is the entire reason the walker is a separate object.</p>`,
      full: FULL_CONCRETE
    },

    // 11
    {
      title: "A contract for walkers",
      intro: `<p>{{NumberWalker}} only walks {{int}}s in a {{MyNumbers}}. But “move forward, and tell me what's here” makes sense for any sequence of any type. Time to extract the contract.</p>`,
      code: [{ src: `
public interface IMyEnumerator<T>
{
    bool MoveNext();
    T Current { get; }
}` }, { label: "NumberWalker signs the contract (body unchanged)", src: `
public class NumberWalker : IMyEnumerator<int>
{
    // _numbers, _position, MoveNext(), Current — exactly as before
}` }],
      diagram: `
IMyEnumerator<T>                    "something that can walk through T values"
 ├── bool MoveNext()
 └── T Current { get; }
          ▲
          │ implements, with T = int
          │
    NumberWalker`,
      changed: `<p>A generic interface with the walker's two public members. {{NumberWalker}} implements it with {{T = int}} — the step 7 trick of closing a generic interface.</p>`,
      why: `<p>The interface says nothing about arrays, indexes or {{MyNumbers}}. That's the point: a walker over a linked list, lines of a file, or an infinite sequence of Fibonacci numbers could all implement it. Consumers only learn how to <em>walk</em>, never how the data is stored.</p>`,
      predict: [
        { q: "Why isn't {{Count}} part of {{IMyEnumerator<T>}}?",
          a: "Not everything you can walk knows its size up front — a network stream, a generator, an infinite sequence. The contract asks for the minimum that every walkable thing can provide." },
        { q: "{{NumberWalker}} is not generic. How can it implement {{IMyEnumerator<T>}}?",
          a: "It closes it: {{IMyEnumerator<int>}}. The {{T}} is chosen by the implementer instead of by a caller." }
      ],
      before: `<p>{{IMyEnumerator<T>}} = “I remember where I am, I can move forward, and I can tell you the current {{T}}.”</p>`,
      full: FULL_WALKER_INTERFACE
    },

    // 12
    {
      title: "A contract for collections",
      intro: `<p>The walker has a contract. The collection still returns a concrete {{NumberWalker}}. Let's extract the collection's contract too: “I can give you a walker.”</p>`,
      code: [{ src: `
public interface IMyEnumerable<T>
{
    IMyEnumerator<T> GetEnumerator();
}` }, { label: "MyNumbers signs the contract", src: `
public class MyNumbers : IMyEnumerable<int>
{
    private readonly int[] _items = { 10, 20, 30 };

    public int Count => _items.Length;
    public int this[int index] => _items[index];

    public IMyEnumerator<int> GetEnumerator()     // was: NumberWalker GetWalker()
    {
        return new NumberWalker(this);
    }
}` }],
      diagram: `
IMyEnumerable<T>
     │
     │ GetEnumerator()
     ▼
IMyEnumerator<T>
     │
     ├── MoveNext()
     └── Current


Compare with step 8 — same shape:

IBoxProvider<T>  ── GetBox() ──────────▶  IBox<T>
IMyEnumerable<T> ── GetEnumerator() ───▶  IMyEnumerator<T>`,
      changed: `<p>{{GetWalker()}} was renamed {{GetEnumerator()}} and now returns the interface, not the concrete walker. {{MyNumbers}} implements {{IMyEnumerable<int>}}.</p>`,
      why: `<p>Now <em>both</em> sides are contracts. Code can walk any {{IMyEnumerable<T>}} without knowing what collection it is or what walker it produces. This is exactly step 8: one abstraction that hands out another.</p>`,
      predict: [
        { q: "The method's return type is {{IMyEnumerator<int>}} but it returns a {{NumberWalker}}. Why does that compile?",
          a: "{{NumberWalker}} implements {{IMyEnumerator<int>}}, so it <em>is</em> one. The caller only ever sees the interface." }
      ],
      before: `<p>Two small interfaces, one returning the other. That's the whole machine. The rest of the tutorial is just using it.</p>`,
      full: FULL_BOTH_INTERFACES
    },

    // 13
    {
      title: "Iterating by hand",
      intro: `<p>With both contracts in place, here's how you walk a collection. Step through it one call at a time.</p>`,
      code: [{ src: `
var numbers = new MyNumbers();

var enumerator = numbers.GetEnumerator();

while (enumerator.MoveNext())
{
    Console.WriteLine(enumerator.Current);
}` }],
      widget: { type: "loop" },
      diagram: `
call                      _position   returns
─────────────────────     ─────────   ───────────────
GetEnumerator()              -1       a fresh walker
MoveNext()                    0       true
Current                       0       10
MoveNext()                    1       true
Current                       1       20
MoveNext()                    2       true
Current                       2       30
MoveNext()                    3       false  → loop ends`,
      changed: `<p>No new types. Just the calling code.</p>`,
      why: `<p>This loop only uses the two interface members. So it works for <em>any</em> {{IMyEnumerable<T>}} — you can pull it into a generic helper:</p>`,
      code2: [{ src: `
static void PrintAll<T>(IMyEnumerable<T> source)
{
    var enumerator = source.GetEnumerator();
    while (enumerator.MoveNext())
    {
        Console.WriteLine(enumerator.Current);
    }
}` }],
      predict: [
        { q: "How many times is {{MoveNext()}} called for a 3-item collection?",
          a: "Four. Three times it returns {{true}}, and a fourth time it returns {{false}} to end the loop." },
        { q: "After the loop, can you reuse {{enumerator}} to walk the numbers again?",
          a: "Not usefully — it's past the end. Call {{GetEnumerator()}} again for a fresh walker." }
      ],
      before: `<p>Get a walker, move-then-read until {{MoveNext()}} says no. Remember this loop — you're about to find it hiding inside a keyword.</p>`,
      full: FULL_BOTH_INTERFACES + `

// Usage
var numbers = new MyNumbers();
var enumerator = numbers.GetEnumerator();

while (enumerator.MoveNext())
{
    Console.WriteLine(enumerator.Current);
}`
    },

    // 14
    {
      title: "Meet the real .NET interfaces",
      intro: `<p>Here are your interfaces next to the ones in {{System.Collections.Generic}}, simplified.</p>`,
      code: [{ label: "yours", src: `
public interface IMyEnumerable<T>
{
    IMyEnumerator<T> GetEnumerator();
}

public interface IMyEnumerator<T>
{
    bool MoveNext();
    T Current { get; }
}` }, { label: ".NET (simplified)", src: `
public interface IEnumerable<T>
{
    IEnumerator<T> GetEnumerator();
}

public interface IEnumerator<T>
{
    bool MoveNext();
    T Current { get; }
}` }],
      diagram: `
IMyEnumerable<T>   ═══   IEnumerable<T>
IMyEnumerator<T>   ═══   IEnumerator<T>
GetEnumerator()    ═══   GetEnumerator()
MoveNext()         ═══   MoveNext()
Current            ═══   Current`,
      changed: `<p>Only the names. Remove “My” and you have the framework.</p>`,
      why: `<p>You didn't learn these interfaces by reading documentation; you arrived at them by solving the problem. That's why they have exactly these members — each one exists for a reason you've already met.</p>`,
      extra: [{ summary: "The plumbing we hid", html: `
<p>The real definitions carry some extra weight for historical and practical reasons:</p>
<ul>
<li>{{IEnumerable<out T> : IEnumerable}} — every generic enumerable is also a non-generic one (pre-generics .NET 1.x compatibility), which is why implementers write an explicit {{IEnumerable.GetEnumerator()}}.</li>
<li>{{IEnumerator<out T> : IDisposable, IEnumerator}} — the non-generic {{IEnumerator}} adds {{object Current}} and {{Reset()}}. {{IDisposable}} lets a walker release resources (a file handle, a DB reader) when a loop exits early.</li>
<li>{{out T}} is covariance: an {{IEnumerable<string>}} can be used where an {{IEnumerable<object>}} is expected, because {{T}} only ever comes <em>out</em>.</li>
</ul>
<p>None of that changes the core idea. Open “complete code” below to see {{MyNumbers}} implementing the real interfaces.</p>` }],
      predict: [
        { q: "Why is {{T}} marked {{out}} in the real {{IEnumerable<out T>}}?",
          a: "{{T}} only appears in output positions ({{Current}}'s getter). That makes it safe to treat a sequence of {{string}} as a sequence of {{object}}, so the compiler allows it." }
      ],
      before: `<p>{{IEnumerable<T>}} and {{IEnumerator<T>}} are the two interfaces you just built, plus some compatibility plumbing.</p>`,
      full: FULL_REAL
    },

    // 15
    {
      title: "What foreach really is",
      intro: `<p>You've written this thousands of times:</p>`,
      code: [{ src: `
foreach (var number in numbers)
{
    Console.WriteLine(number);
}` }, { label: "what the compiler turns it into (conceptually)", src: `
var enumerator = numbers.GetEnumerator();

while (enumerator.MoveNext())
{
    var number = enumerator.Current;
    Console.WriteLine(number);
}` }],
      diagram: `
foreach (var number in numbers)
             │           │
             │           └── numbers.GetEnumerator()
             │
             └── each pass: MoveNext() is true → number = Current`,
      changed: `<p>Nothing. This is the loop from step 14, wearing a keyword.</p>`,
      why: `<p><strong>{{foreach}} is syntax that hides the enumerator plumbing.</strong> It calls {{GetEnumerator()}} once, then loops “move, then read” until {{MoveNext()}} returns {{false}}. There's no magic list access and no index.</p>`,
      extra: [{ summary: "Closer to the real lowering", html: `
<p>Because {{IEnumerator<T>}} is {{IDisposable}}, the compiler also guarantees cleanup, even if the loop body throws or {{break}}s:</p>
<pre class="code" data-cs>var enumerator = numbers.GetEnumerator();
try
{
    while (enumerator.MoveNext())
    {
        var number = enumerator.Current;
        Console.WriteLine(number);
    }
}
finally
{
    enumerator.Dispose();
}</pre>` }],
      predict: [
        { q: "Would {{foreach}} work over your {{IMyEnumerable<int>}} version of {{MyNumbers}} from step 13?",
          a: "Yes. {{foreach}} is <em>pattern-based</em>: the compiler only needs a {{GetEnumerator()}} method whose return type has {{bool MoveNext()}} and a {{Current}} property. Implementing {{IEnumerable<T>}} is the conventional way to provide that — and it's what LINQ requires — but the loop itself only needs the shape." },
        { q: "How many enumerators does a {{foreach}} create?",
          a: "One per loop. Nested {{foreach}} over the same collection creates two independent walkers — exactly the step 11 scenario." }
      ],
      before: `<p>Every {{foreach}} you've ever written was: get a fresh walker, move-then-read until done.</p>`,
      full: FULL_REAL
    },

    // 16
    {
      title: "The design ideas underneath",
      intro: `<p>This structure has a name: the <strong>Iterator pattern</strong>. Separate the thing that holds items from the thing that walks them, and put a contract on each.</p>`,
      diagram: `
Iterator pattern        your code          .NET
────────────────        ─────────          ────────────────────
Aggregate               MyNumbers          List<T>, T[], HashSet<T>
Iterator                NumberWalker       List<T>.Enumerator
CreateIterator()        GetEnumerator()    GetEnumerator()`,
      changed: `<p>Only the vocabulary.</p>`,
      why: `<p>Along the way you used every idea that frameworks are made of:</p>
<ul>
<li><strong>Separation of responsibilities</strong> — data in one object, traversal state in another (step 9).</li>
<li><strong>Composition / delegation</strong> — the walker holds a reference to the collection and delegates reads to it (step 10).</li>
<li><strong>Abstraction through interfaces</strong> — callers depend on contracts, not classes (steps 6, 12, 13).</li>
<li><strong>Generic contracts</strong> — one interface, any {{T}} (steps 4, 6).</li>
<li><strong>One abstraction producing another</strong> — {{GetBox()}}, then {{GetEnumerator()}} (steps 8, 13).</li>
</ul>`,
      extra: [{ summary: "Bonus: yield return writes the walker for you", html: `
<p>Writing a walker class by hand is tedious, so C# will generate one:</p>
<pre class="code" data-cs>public IEnumerator&lt;int&gt; GetEnumerator()
{
    yield return 10;
    yield return 20;
    yield return 30;
}</pre>
<p>The compiler turns this method into a hidden class with a state field, a {{MoveNext()}} and a {{Current}} — the same thing as your {{NumberWalker}}, just machine-written.</p>` }],
      predict: [
        { q: "Where does LINQ fit into this?",
          a: "LINQ's {{Where}}, {{Select}} and friends are extension methods on {{IEnumerable<T>}}. Each one returns a new {{IEnumerable<T>}} whose walker wraps the source's walker. It's step 8 composed with itself, over and over." }
      ],
      before: `<p>You don't need to memorise the pattern name. You need to recognise the shape: a collection that hands out independent walkers through a contract.</p>`
    },

    // 17
    {
      title: "The final mental model",
      intro: `<p>Five sentences to keep:</p>`,
      diagram: `
IEnumerable<T>    = "I can give you something that walks my T values."

IEnumerator<T>    = "I know where I am, I can move forward,
                     and I can tell you the current T."

GetEnumerator()   = "Give me a fresh walker."

MoveNext()        = "Move the walker."  (and: "is there something here?")

Current           = "Give me what the walker is pointing at."


Collection
     │
     │ GetEnumerator()
     ▼
Enumerator
     │
     ├── MoveNext()
     └── Current`,
      changed: `<p>Nothing new — this is the whole picture on one screen.</p>`,
      why: `<p>When you meet an unfamiliar framework abstraction, look for the same moves: what's the contract, who implements it, and does one abstraction hand out another?</p>`,
      predict: [
        { q: "{{IEnumerable<T>}} has no {{Count}}. Where does {{Count}} come from on a {{List<T>}}?",
          a: "From richer interfaces layered on top, such as {{IReadOnlyCollection<T>}} and {{ICollection<T>}}, which extend {{IEnumerable<T>}}. The base contract stays minimal so that streams and generators can implement it." }
      ],
      before: `<p>If you can explain each of the five lines above in your own words, you understand enumeration in .NET.</p>`
    },

    // 18 — summary
    {
      title: "Summary: what you actually learned",
      summary: true,
      intro: `<p>You didn't just learn enumeration. You learned how larger C# abstractions are built from smaller ideas, each one small enough to be obvious on its own.</p>`,
      diagram: `
concrete class                    Box
      ↓
generic class                     Box<T>
      ↓
generic interface                 IBox<T>
      ↓
implementation                    Box<T> : IBox<T>
      ↓
object returns another object     IBoxProvider<T>.GetBox()
      ↓
separate traversal state          NumberWalker
      ↓
generic traversal contract        IMyEnumerator<T>, IMyEnumerable<T>
      ↓
IEnumerable / IEnumerator         System.Collections.Generic
      ↓
foreach                           syntax over all of the above`,
      why: `<p>The same recipe explains much of the framework:</p>
<ul>
<li>{{IServiceProvider.GetService()}} — an abstraction that hands out other objects.</li>
<li>{{IAsyncEnumerable<T>}} / {{await foreach}} — the same walker idea with {{MoveNextAsync()}}.</li>
<li>{{IQueryable<T>}} — an enumerable whose walker is produced by translating a query.</li>
<li>{{ILoggerFactory.CreateLogger()}}, {{IHttpClientFactory.CreateClient()}} — step 8 again.</li>
</ul>
<p>Use <strong>Previous</strong> or the step menu to revisit anything, or <strong>Reset tutorial</strong> to start over.</p>`
    }
  ];
})();
