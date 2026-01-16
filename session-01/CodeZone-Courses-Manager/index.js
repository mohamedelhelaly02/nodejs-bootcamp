#!/usr/bin/env node
console.log("CodeZone Courses Manager CLI is running 🚀");


import { Command } from "commander";
import inquirer from 'inquirer';
import fs from 'fs';

const program = new Command();

const filePath = './courses.json';

const questions = [
  { type: 'input', name: 'title', message: 'Please provide a course title: ' },
  { type: 'input', name: 'price', message: 'Please provide a course price: ' }
]

program
  .name('codezone-courses-manager')
  .description('CLI to manage CodeZone courses')
  .version('1.0.1');

program.command('add')
  .alias('a')
  .action(() => {
    inquirer
      .prompt(questions)
      .then((answers) => {
        console.log(answers);

        if (!fs.existsSync(filePath)) {
          fs.writeFile('./courses.json', JSON.stringify([answers]), { encoding: 'utf8' }, () => {
            console.log('Add courses Done');
          })
        } else {
          fs.readFile(filePath, { encoding: 'utf8' }, (err, data) => {
            if (err) {
              console.error(err);
              process.exit();
            } else {
              console.log('fileContent => ', data);
              const fileContentAsJson = Array.from(JSON.parse(data));
              fileContentAsJson.push(answers);
              fs.writeFile('./courses.json', JSON.stringify(fileContentAsJson), { encoding: 'utf8' }, () => {
                console.log('Add courses Done');
              })

            }
          })
        }


      })
      .catch((error) => {
        console.error(error)
      });
  })


program
  .command('list')
  .alias('l')
  .description('list all courses')
  .action(() => {
    // const fileContent = fs.readFileSync(filePath, 'utf8');
    // const courses = Array.from(JSON.parse(fileContent));
    // console.table(courses);

    fs.readFile(filePath, { encoding: 'utf8' }, (err, data) => {
      if (err) {
        console.error(`Error reading courses file: ${err}`);
        process.exit();
      }
      const courses = Array.from(JSON.parse(data));
      console.table(courses);

    })

  })



program.parse();