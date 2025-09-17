---
title: "Decompilers in Reverse Engineering"
description: "First step to get into Reverse Engineering"
date: 2025-09-17
---
# Introduction

A decompiler is a software tool that is designed to `reverse engineer` compiled computer programs or binaries back into a `human-readable programming language` like C or Java. Decompilers are used to analyze and understand the functionality of an application, and are often used by programmers to identify and fix bugs, or to recover lost source code.



![https://www.researchgate.net/publication/270960218_A_survey_of_reverse_engineering_tools_for_the_32-bit_Microsoft_Windows_environment/figures?lo=1&utm_source=google&utm_medium=organic](https://miro.medium.com/v2/resize:fit:640/format:webp/1*nuyD-rnsf1nP3A0RuZcLOQ.png)





In simple terms, when a programmer writes code in a high-level programming language like Java, the code is compiled into a machine language or binary file that is executed by the computer. A decompiler is used to reverse the process of compilation by breaking down the binary code into a readable format that can be analyzed and understood by humans.

Decompilation is not an exact science, and the resulting code is often not identical to the original source code. The output of a decompiler depends on a number of factors such as the complexity of the original code, the quality of the decompiler, and the amount of optimization that was performed during compilation.

In some circumstances, a decompiler can be helpful for the following objectives:

## Recovering lost source code in order to keep or archive the code:
The decompilation procedure makes an effort to recover the source code if it is lost or corrupted. If a programmer loses the original source code for an application, a decompiler can be used to recover a significant portion of the code, which can be very helpful in rebuilding the application. 

## Debugging software:
They can be used to analyze the behavior of an application and identify potential security vulnerabilities. They can be used to reverse engineer malicious code to better understand how it works, and to develop countermeasures to protect against it. Also, the capacity to move a programme between platforms with ease and to analyze third-party apps to understand how they work along with their plug-ins or extensions. This is particularly useful in the development of software for mobile devices, where there is often limited access to the underlying OS.

## Decompiling architecture
The process of decompilation involves reversing the compilation process, by analyzing the compiled code and reconstructing the original source code. This is done by interpreting the binary code and identifying the patterns and structures that are characteristic of the original code.

The exact functioning of a decompiler depends on the language and platform of the executable code, but generally involves the following steps:

Firstly to decompile a program the prerequisite is to reverse engineer it. It consists of scrutinizing the program’s machine level code to interpret the form, flow, and purpose. Reverse engineering can be done using specialized tools or manually by an engineer themselves.

## Disassembly:
The decompiler reads the executable code and creates a disassembly, which is a low-level representation of the instructions in the code. The disassembly shows the binary code in a more human-readable format, making it easier for the decompiler to analyze.

## Control Flow Analysis:
The decompiler analyzes the disassembly to determine the control flow of the program, such as which functions are called and in what order.

## Data Flow Analysis:
The decompiler analyzes the data flow of the program, such as which variables are used and how they are used.

## Reconstruction:
Using the information obtained from the disassembly, control flow analysis, and data flow analysis, the decompiler attempts to reconstruct the original source code. This process can be complicated by factors such as compiler optimizations and obfuscation techniques that are designed to make the code harder to decompile.





![](https://miro.medium.com/v2/resize:fit:1100/format:webp/1*JN8louKO-6j_e9H24BVftA.png)


Let’s consider a simple example of a machine code function that adds two numbers:
```asm
55 push ebp
8B EC mov ebp, esp
8B 45 08 mov eax, [ebp+8]
03 45 0C add eax, [ebp+12]
5D pop ebp
C3 ret
```
This machine code function takes two arguments, adds them together, and returns the result. Now, let’s use a decompiler to reverse engineer this code back into C language code.

Using a decompiler, we get the following C code:
```c
int add(int a, int b) {
return a + b;
}
```

As you can see, the decompiler has successfully reverse engineered the machine code back into C language code that performs the same operation as the original code. The resulting C code is not identical to the original source code, but it is functionally equivalent.

This example illustrates how a decompiler can be used to recover lost source code, or to analyze the behavior of a binary program. However, it is important to note that the quality of the resulting C code depends on a number of factors, including the complexity of the original code, the quality of the decompiler, and the amount of optimization that was performed during compilation. Therefore, it is important to use decompilers with caution and to verify the resulting code before using it in a production environment.

Here is a step-by-step breakdown of how the machine code function back to C language code:

1. Start by examining the machine code and identifying the instructions being used. In this case, we have the following instructions:
```asm
55 push ebp
8B EC mov ebp, esp
8B 45 08 mov eax, [ebp+8]
03 45 0C add eax, [ebp+12]
5D pop ebp
C3 ret
```



2. Translate the instructions into their equivalent assembly language mnemonic. In this case, the assembly code is:
```asm
push ebp
mov ebp, esp
mov eax, [ebp+8]
add eax, [ebp+12]
pop ebp
ret
```



3. Convert the assembly code into C language code. The resulting C code should perform the same operation as the original machine code function. In this case, the resulting C code is:
```c
int add(int a, int b) {
int result;
result = a + b;
return result;
}
````


4. Simplify the resulting C code by removing unnecessary variables or statements. In this case, the resulting code is already fairly simple, so there are no further simplifications that can be made.
```c
int add(int a, int b) {
return a + b;
}
```

5. Verify the resulting C code by testing it against the original machine code function. In this case, the resulting C code is correct, and it performs the same operation as the original machine code function.

In the example we used, the machine code function was using three registers: `ebp`, `esp`, and `eax`.

- `ebp` stands for “extended base pointer” and is used as a base address for accessing parameters and local variables within a function. In the code example, `mov ebp, esp` sets the value of the `ebp` register to the current value of the stack pointer `esp`, which creates a new base pointer that points to the current stack frame.

- `esp` stands for “extended stack pointer” and is used to keep track of the current location in the stack. In the code example, `push ebp` and `pop ebp` modify the value of `esp` by pushing and popping the value of the base pointer `ebp` onto the stack.

- `eax` is a general-purpose register that is often used to store the return value of a function. In the code example, `mov eax, [ebp+8]` moves the first function argument (which is stored at `[ebp+8]`) into the `eax` register, and `add eax, [ebp+12]` adds the second function argument (which is stored at `[ebp+12]`) to the value in the `eax` register.

Overall, these registers are used to manage memory and perform arithmetic operations within the function.

## Dex2Jar


![https://www.kali.org/tools/dex2jar/](https://miro.medium.com/v2/resize:fit:450/format:webp/1*YHq9cbYGVkLMm0GplB-mvA.png)

Some of the decompiler tools are dex2jar. The dex-reader is designed to read the Dalvik Executable (.dex/.odex) format. It converts .dex to classes in form of jar files. Here’s on how to use dex2jar:

Step 1: Install Java Development Kit (JDK) Make sure you have Java Development Kit (JDK) installed on your computer. You can download and install JDK from the official Oracle website.

Step 2: Download Dex2jar Download the latest version of dex2jar from the GitHub repository or other reliable sources.

Step 3: Extract Dex2jar Extract the downloaded dex2jar archive to a folder of your choice.

Step 4: Convert APK to JAR Open a command prompt or terminal window and navigate to the folder where you extracted dex2jar.

Run the following command to convert the APK to a JAR file in Windows:
```
d2j-dex2jar.bat <path-to-apk-file>
```

Replace `<path-to-apk-file>` with the actual path to the APK file you want to convert.

Step 5: Obtain JAR File After running the above command, dex2jar will generate a JAR file in the same folder where the APK file is located.

Step 6: Extract JAR File You can now use any Java decompiler, such as JD-GUI or Fernflower, to decompile the generated JAR file and obtain the source code.

Done!

In conclusion, a decompiler is a powerful tool that is used to analyze and understand compiled computer programs. It is used by programmers to identify and fix bugs, recover lost source code, and analyze third-party applications. While decompilation is not an exact science, it is an important tool in the software development process, and is an essential part of the toolkit for any serious programmer.



## References:
https://www.researchgate.net/publication/270960218_A_survey_of_reverse_engineering_tools_for_the_32-bit_Microsoft_Windows_environment

https://www.securing.pl/en/prevent-reverse-engineering-re-of-your-android-application/

https://www.kali.org/tools/dex2jar/